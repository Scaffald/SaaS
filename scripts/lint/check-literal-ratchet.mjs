#!/usr/bin/env node
// Hold the line on literal font sizes, radii and hex colours in
// packages/scf-core/features — per directory, per pattern, counts may only go
// down.
//
// Run: pnpm lint:literals          (check)
//      pnpm lint:literals --update (rewrite the baseline after an improvement)
//
// ## Why a ratchet rather than a ban
//
// The tokens landed in #621 and nothing stopped new literals, so the counts
// went the wrong way during the redesign: `fontSize:` sites rose from 699 to
// 720 while three releases of reskinning were in flight (#819). A ban is not
// available — there are hundreds of sites and each needs a human to pick the
// right step — so this pins the known-bad per directory and fails anything
// worse.
//
// Per directory, not one total, on purpose: a single number lets you add
// literals to office while fixing communities and still pass. The directory is
// also the unit a codemod works in (#820 is office alone).
//
// ## Both syntaxes, which the issue's numbers missed
//
// #819 measured `borderRadius: <n>` and found 360 sites. It did not measure
// `borderRadius={<n>}`, the JSX prop form, which is another 355 — more than the
// style-object form's 337. With one `borderRadius = <n>` assignment that is 693,
// not 360. Same for hex: the issue counted `'#abc'` and missed `"#abc"`, which
// is 124 of the 273 real sites.
//
// Counting one syntax and not the other would have left the obvious bypass open
// on day one, so all three forms are counted and the baseline is measured fresh
// rather than carried over from the issue.
//
// fontSize is the one the issue got right, and it has since improved on its own:
// 637, down from the 720 it reported.
//
// ## What is not counted
//
// Tests, stories and `__tests__` directories. A literal in a test fixture is
// not product styling, and counting them means a mock colour can block an
// unrelated PR — `auth/components/__tests__/ConnectedAccounts.test.tsx` passes
// '#444' and '#bbb' as sample values, which is correct code.
//
// Pinned files are listed in the baseline with a reason and excluded entirely.
// There is exactly one: `marketing/theme.ts` is a deliberate palette that the
// file itself explains is deliberately not in @scaffald/ui tokens. #819 also
// proposed pinning `luscher-test` for literal colour; that directory has no hex
// literals left, so no exception is needed and none is added.
//
// ## Improvements do not fail
//
// Falling counts print the tightening to apply and exit 0. Failing on an
// improvement would put every unrelated PR in the business of editing this
// baseline. `--update` writes it for you.

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const BASELINE = join(ROOT, 'scripts/lint/literal-baseline.json')
const UPDATE = process.argv.includes('--update')

/**
 * The patterns. Each covers both the style-object form (`fontSize: 13`) and the
 * JSX prop form (`fontSize={13}`), because a check that only sees one is a
 * check you can walk around without noticing.
 *
 * `\b` before the name keeps `maxFontSizeMultiplier={1.2}` out: there is no
 * word boundary inside camelCase, so it cannot match mid-identifier.
 */
const PATTERNS = {
  borderRadius: {
    regex: /\bborderRadius\s*[:=]\s*\{?\s*\d+(?:\.\d+)?/g,
    hint: 'borderRadius from @scaffald/ui tokens — the scale is 2 (xxs) · 4 (xs/s/m) · 7 (l/xl/xxl) · 999 (max)',
  },
  fontSize: {
    regex: /\bfontSize\s*[:=]\s*\{?\s*\d+(?:\.\d+)?/g,
    hint: 'fontSize or fontScale from @scaffald/ui tokens — the scale is 11 · 12.5 · 14 · 17 · 22 · 30, display 42',
  },
    hexColor: {
    regex: /['"]#[0-9a-fA-F]{3,8}['"]/g,
    hint: 'colors.* from @scaffald/ui tokens, with the [theme] dimension',
  },
  // Raw indices into ramps that are not part of the palette's semantic roles
  // (#1028). Blue and purple have no place in a teal/amber UI; picking
  // `theme === 'light' ? colors.blue[50] : colors.blue[900]` by hand is how the
  // personality test ended up with a navy card in dark mode. Status ramps
  // (green, yellow, red) are not counted here — they map to success / warning /
  // error and are a separate question.
  accentRamp: {
    regex: /\bcolors\.(?:blue|purple|indigo|violet|pink)\[\d+\]/g,
    hint: 'a semantic token — colors.text[theme].emphasis, colors.fg[theme].active, colors.bg[theme].emphasis — not a raw blue/purple ramp',
  },
}

const SKIP_DIRS = new Set(['__tests__', '__mocks__', '__snapshots__', 'node_modules'])
const isSkippedFile = (name) =>
  /\.(?:test|spec|stories)\.[jt]sx?$/.test(name) || !/\.(?:ts|tsx)$/.test(name)

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), out)
    } else if (!isSkippedFile(entry.name)) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

/** Files changed against the merge-base, so the report can point at the likely culprit. */
function changedFiles() {
  for (const range of ['origin/main...HEAD', 'HEAD']) {
    try {
      const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', range], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
      const tracked = out.split('\n').filter(Boolean)
      // Unstaged work too — the common case is running this right after an edit.
      const dirty = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .split('\n')
        .filter(Boolean)
      return new Set([...tracked, ...dirty])
    } catch {
      // Shallow clone with no origin/main, or not a git dir — try the next range.
    }
  }
  return new Set()
}

if (!existsSync(BASELINE)) {
  console.error(`✖ Baseline not found: ${relative(ROOT, BASELINE)}`)
  console.error('  Create it with: pnpm lint:literals --update')
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
const scanRoot = join(ROOT, baseline.root)
const pinned = new Set(Object.keys(baseline.pinned ?? {}))
const ceilings = baseline.ceilings ?? {}

if (!existsSync(scanRoot) || !statSync(scanRoot).isDirectory()) {
  console.error(`✖ Baseline root does not exist: ${baseline.root}`)
  console.error('  The tree moved. Point `root` at it rather than letting this pass silently.')
  process.exit(1)
}

for (const name of Object.keys(PATTERNS)) {
  if (!Object.hasOwn(baseline.patterns ?? {}, name)) {
    console.error(`✖ Baseline does not describe the \`${name}\` pattern.`)
    console.error('  Every pattern this script counts must be documented in the baseline.')
    process.exit(1)
  }
}

for (const file of pinned) {
  if (!existsSync(join(scanRoot, file))) {
    console.error(`✖ Pinned file no longer exists: ${file}`)
    console.error("  Remove it from the baseline's `pinned` map — a stale exception hides drift.")
    process.exit(1)
  }
}

const files = walk(scanRoot)

// A walk that finds nothing is a check that always passes. That is how a
// ratchet quietly stops being one (#921, and the ANSI bug in
// check-edge-fn-types.mjs).
if (files.length === 0) {
  console.error(`✖ No .ts/.tsx files found under ${baseline.root}.`)
  console.error('  This check cannot pass on an empty scan — fix the root or the walk.')
  process.exit(1)
}

/** directory -> pattern -> count, and directory -> pattern -> [{file, n}] */
const observed = new Map()
const perFile = new Map()
let skippedPinned = 0

for (const abs of files) {
  const rel = relative(scanRoot, abs)
  if (pinned.has(rel)) {
    skippedPinned += 1
    continue
  }
  const dir = rel.split(sep)[0]
  const source = readFileSync(abs, 'utf8')

  for (const [name, { regex }] of Object.entries(PATTERNS)) {
    const n = source.match(regex)?.length ?? 0
    if (n === 0) continue
    const byPattern = observed.get(dir) ?? new Map()
    byPattern.set(name, (byPattern.get(name) ?? 0) + n)
    observed.set(dir, byPattern)

    const key = `${dir}::${name}`
    const list = perFile.get(key) ?? []
    list.push({ file: join(baseline.root, rel), n })
    perFile.set(key, list)
  }
}

if (skippedPinned !== pinned.size) {
  console.error(
    `✖ ${pinned.size} file(s) are pinned but only ${skippedPinned} were reached by the walk.`
  )
  console.error('  A pinned path the walk never visits is counted anyway. Check the paths.')
  process.exit(1)
}

const dirs = new Set([...observed.keys(), ...Object.keys(ceilings)])
const worse = []
const better = []
const next = {}

for (const dir of [...dirs].sort()) {
  for (const name of Object.keys(PATTERNS).sort()) {
    const count = observed.get(dir)?.get(name) ?? 0
    const cap = ceilings[dir]?.[name] ?? 0
    if (count > cap) worse.push({ dir, name, count, cap })
    else if (count < cap) better.push({ dir, name, count, cap })
    if (count > 0) {
      next[dir] ??= {}
      next[dir][name] = count
    }
  }
}

const totals = Object.fromEntries(
  Object.keys(PATTERNS)
    .sort()
    .map((name) => [
      name,
      [...observed.values()].reduce((sum, byPattern) => sum + (byPattern.get(name) ?? 0), 0),
    ])
)
const summary = Object.entries(totals)
  .map(([name, n]) => `${name} ${n}`)
  .join(', ')

function reportWorse() {
  const changed = changedFiles()
  console.error(`✖ Literal styling increased in packages/scf-core/features (${summary}).\n`)

  for (const { dir, name, count, cap } of worse) {
    const ceiling = cap === 0 ? 'held at zero' : `ceiling ${cap}`
    console.error(`    ${dir} — ${name}: ${count}, ${ceiling}`)
    const list = (perFile.get(`${dir}::${name}`) ?? []).sort(
      (a, b) => Number(changed.has(b.file)) - Number(changed.has(a.file)) || b.n - a.n
    )
    for (const { file, n } of list.slice(0, 8)) {
      const mark = changed.has(file) ? '  <- changed in this branch' : ''
      console.error(`        ${n}  ${file}${mark}`)
    }
    if (list.length > 8) console.error(`        … ${list.length - 8} more file(s)`)
    console.error(`      Use ${PATTERNS[name].hint}`)
    console.error('')
  }

  console.error('  The ceilings may only come down. See .radium/scaffald-ui.md for the map from')
  console.error('  each literal value to its token. If a literal is genuinely right — a palette')
  console.error("  that is not the product's — pin the file in the baseline with a reason.")
}

if (UPDATE) {
  // `--update` lowers ceilings. It will not raise one, or the escape hatch for
  // an improvement becomes the escape hatch for a regression.
  //
  // The exception is a baseline with no ceilings at all, which is the one-time
  // bootstrap. That is a distinct state rather than a loophole: once seeded,
  // `ceilings` is never empty again, and emptying it to re-seed is a visible
  // diff a reviewer would have to accept.
  const seeding = Object.keys(ceilings).length === 0
  if (worse.length > 0 && !seeding) {
    reportWorse()
    console.error('\n  --update refused: it lowers ceilings, it does not raise them.')
    process.exit(1)
  }
  if (seeding) console.log('Seeding an empty baseline — the one-time bootstrap.\n')

  const updated = {
    ...baseline,
    measuredAt: new Date().toISOString().slice(0, 10),
    ceilings: Object.fromEntries(
      Object.keys(next)
        .sort()
        .map((dir) => [
          dir,
          Object.fromEntries(
            Object.keys(next[dir])
              .sort()
              .map((name) => [name, next[dir][name]])
          ),
        ])
    ),
  }
  writeFileSync(BASELINE, `${JSON.stringify(updated, null, 2)}\n`)
  console.log(`✓ Baseline rewritten (${summary})`)
  if (better.length > 0) {
    console.log(`\n  ${better.length} ceiling(s) lowered:`)
    for (const { dir, name, count, cap } of better) {
      console.log(
        count === 0
          ? `    ${dir}.${name}  ${cap} -> removed`
          : `    ${dir}.${name}  ${cap} -> ${count}`
      )
    }
  }
  process.exit(0)
}

if (worse.length > 0) {
  reportWorse()
  process.exit(1)
}

console.log(`✓ Literal styling within baseline (${summary})`)

if (better.length > 0) {
  console.log(
    `\n  ${better.length} ceiling(s) can be lowered — run \`pnpm lint:literals --update\`:`
  )
  for (const { dir, name, count, cap } of better) {
    console.log(
      count === 0
        ? `    ${dir}.${name}  ${cap} -> removed`
        : `    ${dir}.${name}  ${cap} -> ${count}`
    )
  }
}
