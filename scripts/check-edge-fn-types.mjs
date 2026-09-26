#!/usr/bin/env node
// Type-check every Supabase edge function, and refuse to let any of them get
// worse.
//
// ## Why this replaced `deno check index.ts` with `continue-on-error: true`
//
// That step, in api-tests.yml, carried `continue-on-error: true` from the day it
// was written, so it had never once been able to fail (#921). 404 errors had
// accumulated behind it on the `api` function.
//
// 70 of those were a single misconfiguration. `functions/api/deno.json` resolved
// `zod` from `deno.land/x` while `@hono/zod-openapi` resolved its own peer from
// npm, so every `z.object()` handed to `createRoute` was built by a different
// zod than the library's types expected — hundreds of errors from one line. That
// is fixed in the same change as this script and the whole family is now zero.
//
// ## Why a ratchet rather than a plain gate
//
// The 334 that remain on `api` are real, and they are two shapes:
//
//   ~117  a handler returns a status the route's `responses` never declared, so
//         JSONRespondReturn<…, 401> will not fit RouteConfigToTypedResponse
//   ~103  data-shape mismatches, e.g. summing rows into a shape missing `date`
//
// Each needs a decision about what that route's contract should be. That is
// per-route work and does not belong in a CI fix. So the known-bad is pinned per
// file and anything worse fails.
//
// Per file, not one total, on purpose: a single number lets you add errors to
// one route while fixing another and still pass.
//
// ## Why it covers every function, not just `api`
//
// `pnpm test:deno:types` used to `find` every .ts under `functions/` and check
// them in one go, which meant checking each file WITHOUT its function's import
// map. That reported 315 errors, most of them artefacts — it flagged
// `packages/scf-schemas/src/common/phone.ts` for importing `awesome-phonenumber`,
// which is correct in its real context.
//
// Checked properly, from each function's own directory:
//
//     api                    334
//     trpc                     0
//     stripe-webhook           0
//     email-inbound-parse     11
//     news-import              0
//
// Three functions are already clean. They are now held at zero — a new type
// error in any of them fails immediately, which nothing previously did.
//
// ## Burning it down
//
// Fix a file, run this, and it prints the lower number to paste into the
// baseline. Improvements do not fail the build — that would put unrelated PRs in
// the business of editing this file — but the nudge makes tightening it a
// one-line edit.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FUNCTIONS = join(ROOT, 'packages/supabase/functions')
const BASELINE = join(FUNCTIONS, 'TYPECHECK_BASELINE.json')

if (!existsSync(BASELINE)) {
  console.error(`✖ Baseline not found: ${BASELINE}`)
  process.exit(1)
}

/**
 * Every function with an entrypoint. Deliberately NOT "every function with its
 * own deno.json" — only five have one, and the deployed set (job-import, news,
 * the notify-* pipeline, send-team-invitation, webhooks-email) inherits
 * `functions/deno.json` instead. Requiring a local config would have skipped
 * almost everything that actually ships.
 *
 * Checked from the function's own directory so deno walks up to the right
 * config and its import map applies. Checking files from anywhere else is what
 * made `pnpm test:deno:types` meaningless.
 */
function functionsWithEntrypoints() {
  return readdirSync(FUNCTIONS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => existsSync(join(FUNCTIONS, name, 'index.ts')))
    .sort()
}

/** file (repo-relative) -> error count, for one function. */
function checkOne(fnName) {
  const cwd = join(FUNCTIONS, fnName)
  let raw = ''
  try {
    // deno check exits non-zero whenever there are errors, which is the normal
    // case here — read its output rather than trusting the exit code.
    // --node-modules-dir=auto on the command line rather than in each
    // function's deno.json: only `api` sets it, and without it deno aborts at
    // startup on any function using npm: specifiers. Passing it here keeps the
    // functions' own config — which the Supabase runtime also reads — untouched.
    raw = execFileSync('deno', ['check', '--node-modules-dir=auto', 'index.ts'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('✖ deno is not on PATH. Install it, or skip this check locally.')
      process.exit(1)
    }
    raw = `${err.stdout ?? ''}${err.stderr ?? ''}`
  }

  // Strip ANSI so the parse does not depend on whether deno saw a tty. The
  // escape character matters: dropping only the `[…m` leaves a bare \x1b at the
  // start of each line, and then `^TS` never matches and every function reports
  // zero errors — a ratchet that always passes.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: matching the ANSI escape is the point
  const text = raw.replace(/\x1b\[[0-9;]*m/g, '')
  const counts = new Map()
  let unattributed = 0

  for (const block of text.split(/(?=^TS\d+ \[ERROR\])/m)) {
    if (!block.startsWith('TS')) continue
    const at = block.match(/^\s+at (file:\/\/\S+?):(\d+):(\d+)/m)
    if (!at) {
      unattributed += 1
      continue
    }
    let file = fileURLToPath(at[1])
    file = file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file
    counts.set(file, (counts.get(file) ?? 0) + 1)
  }

  // A startup abort produces an `error:` line and NO diagnostics — deno never
  // type-checked anything. Scoring that as zero is how an earlier draft of this
  // script reported three functions "clean" when they had not been looked at.
  // `error: Type checking failed.` is just deno's trailer after real
  // diagnostics, so it does not count.
  const aborted = text
    .split('\n')
    .filter((l) => l.startsWith('error: ') && !l.includes('Type checking failed'))
    .map((l) => l.slice('error: '.length).trim())

  return { counts, unattributed, aborted }
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
const allowed = baseline.files ?? {}

const observed = new Map()
let unattributed = 0
const perFunction = []
const unexpectedlyUncheckable = []
const knownUncheckable = baseline.uncheckable ?? {}

for (const fn of functionsWithEntrypoints()) {
  const { counts, unattributed: u, aborted } = checkOne(fn)
  unattributed += u
  if (aborted.length > 0) {
    if (!Object.hasOwn(knownUncheckable, fn)) {
      unexpectedlyUncheckable.push({ fn, why: aborted[0] })
    }
    continue
  }
  let subtotal = 0
  for (const [file, n] of counts) {
    observed.set(file, (observed.get(file) ?? 0) + n)
    subtotal += n
  }
  perFunction.push({ fn, subtotal })
}

if (unexpectedlyUncheckable.length > 0) {
  console.error('✖ deno could not type-check these functions at all:\n')
  for (const { fn, why } of unexpectedlyUncheckable) {
    console.error(`    ${fn} — ${why}`)
  }
  console.error(
    '\n  A function deno cannot load is not a passing function. Fix the cause,\n' +
      "  or add it to the baseline's `uncheckable` map with a reason and an issue\n" +
      '  number so it is an acknowledged gap rather than a silent zero.'
  )
  process.exit(1)
}

if (unattributed > 0) {
  console.error(
    `✖ ${unattributed} error(s) could not be attributed to a file.\n` +
      "  deno's output format may have changed; this script's parser needs a look."
  )
  process.exit(1)
}

const worse = []
const newFiles = []
const better = []

for (const [file, n] of [...observed].sort()) {
  const cap = allowed[file]
  if (cap === undefined) newFiles.push({ file, n })
  else if (n > cap) worse.push({ file, n, cap })
  else if (n < cap) better.push({ file, n, cap })
}

// A baselined file with nothing left should leave the baseline rather than stay
// as a standing excuse.
for (const file of Object.keys(allowed).sort()) {
  if (!observed.has(file)) better.push({ file, n: 0, cap: allowed[file] })
}

const total = [...observed.values()].reduce((a, b) => a + b, 0)
const summary = perFunction.map(({ fn, subtotal }) => `${fn} ${subtotal}`).join(', ')

if (newFiles.length > 0 || worse.length > 0) {
  console.error(`✖ Edge function type errors increased (${total} total — ${summary}).\n`)
  for (const { file, n } of newFiles) {
    console.error(`    NEW    ${file} — ${n} error(s), not in the baseline`)
  }
  for (const { file, n, cap } of worse) {
    console.error(`    WORSE  ${file} — ${n} error(s), baseline allows ${cap}`)
  }
  console.error(
    '\n  See them with, e.g.:\n' +
      '    cd packages/supabase/functions/api && deno check index.ts\n' +
      '\n  The two shapes this usually is (#921):\n' +
      "    * a handler returns a status the route's `responses` never declared\n" +
      '    * a value does not match the shape the function it is passed to wants\n' +
      '\n  Fix them. Do not raise the baseline — it may only come down.'
  )
  process.exit(1)
}

console.log(`✓ Edge function type errors within baseline (${total} total — ${summary})`)

if (better.length > 0) {
  console.log(
    `\n  ${better.length} file(s) improved. Tighten packages/supabase/functions/TYPECHECK_BASELINE.json:`
  )
  for (const { file, n, cap } of better) {
    console.log(n === 0 ? `    remove  ${file}  (was ${cap})` : `    ${file}: ${cap} -> ${n}`)
  }
}
