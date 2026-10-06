/**
 * Authenticated route sweep — every static screen, both app modes, two widths.
 *
 * `smoke-authed.mjs` looks hard at four ATS screens. This one looks briefly at
 * every screen, which is what a reskin needs: the same session-minting trick,
 * a route list derived from the app directory (so it cannot drift from the
 * router), and per-capture facts that a screenshot alone does not give you —
 * where the page landed, whether it scrolls sideways on a phone, where its
 * title sits, and whether the console complained.
 *
 * Local only. Needs `pnpm supa start` (which serves the `api` function) and a dev
 * server (see .claude/launch.json).
 *
 *   SWEEP_BASE_URL=http://localhost:8081 \
 *   SWEEP_EMAIL=zach@unicorn.love SWEEP_PASSWORD=password123 \
 *   node scripts/audit/sweep-routes.mjs --scheme both
 *
 * Optional: SWEEP_ONLY=/office,/profile (prefix filter), SWEEP_OUT=<dir>,
 * SWEEP_MODES=worker (skip employer mode — for an account with no org),
 * --scheme light|dark|both (default light).
 * Writes PNGs plus sweep.json and sweep.md to the output directory, and exits
 * 1 if any capture rendered a theme other than the one asked for.
 */

import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { EXIT_INFRA, finish, isServerGone, requireServer } from './lib/dev-server.mjs'
import {
  COOKIE_CONSENT_KEY,
  cookieConsentValue,
  frameFacts,
  luminance,
  parseSchemes,
  waitForAppReady,
} from './lib/app-ready.mjs'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SWEEP_BASE_URL || 'http://localhost:8081'
const OUT = process.env.SWEEP_OUT || 'docs/plans/redesign/shots-current'
const ONLY = (process.env.SWEEP_ONLY || '').split(',').filter(Boolean)
const EMPLOYER_ORG = process.env.SWEEP_ORG_SLUG || 'unicorn'
const SCHEMES = parseSchemes()
const MODES = (process.env.SWEEP_MODES || 'worker,employer').split(',').filter(Boolean)

if (!ANON) {
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required (see .env)')
  process.exit(1)
}
await requireServer(BASE)

// ---------------------------------------------------------------------------
// Routes: every static page file under apps/scaffald/app, with the (group)
// segments stripped. Dynamic segments need an id and are out of scope here.
// ---------------------------------------------------------------------------
const APP_DIR = 'apps/scaffald/app'
const SKIP = [
  /^\/auth\/(callback|confirm|verify|success)$/, // redirect targets, not screens
  /^\/legal-update$/, // gated on a pending legal doc
  /^\/teams\/invitations\/accept$/, // token-driven
  /^\/onboarding$/, // redirects a completed profile away
  /^\/profile\/wizard$/,
]
function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'components' || name.startsWith('[')) continue
      out.push(...walk(p))
      continue
    }
    if (!name.endsWith('.tsx') || name.startsWith('_') || name.startsWith('[')) continue
    if (/^[A-Z]/.test(name)) continue // a component file living beside a route
    out.push(p)
  }
  return out
}
const toRoute = (file) => {
  let r = '/' + relative(APP_DIR, file).replace(/\.tsx$/, '')
  r = r.replace(/\/\([^)]+\)/g, '').replace(/\/index$/, '')
  return r === '' ? '/' : r
}
const files = walk(APP_DIR)
// The `(public)` group renders light whatever the reader's theme
// (LIGHT_ONLY_GROUP in packages/scf-core/provider/theme/dark-mode-flag.ts), so
// a dark pass expects light there and dark everywhere else.
const LIGHT_ONLY = new Set(files.filter((f) => f.includes('/(public)/')).map(toRoute))
const expectedTheme = (route, scheme) => (LIGHT_ONLY.has(route) ? 'light' : scheme)
const routes = [...new Set(files.map(toRoute))]
  .filter((r) => !SKIP.some((re) => re.test(r)))
  .filter((r) => ONLY.length === 0 || ONLY.some((p) => r.startsWith(p)))
  .sort()

// Which app mode a route is meant for. `/dashboard` and `/` are captured in
// both, since the drawer and the home screen change with the mode.
function modesFor(route) {
  if (route === '/' || route === '/dashboard') return ['worker', 'employer']
  if (/^\/(employers|office|jobs\/my-listings)/.test(route)) return ['employer']
  return ['worker']
}

// ---------------------------------------------------------------------------
// Session — same derivation as tests/infrastructure/playwright/setup/setup/auth.setup.ts
// ---------------------------------------------------------------------------
const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
const supabase = createClient(SUPABASE_URL, ANON)
const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.SWEEP_EMAIL,
  password: process.env.SWEEP_PASSWORD,
})
if (error) {
  console.error('AUTH FAILED:', error.message)
  process.exit(1)
}
console.log(`✓ session minted for ${data.user?.email}; ${routes.length} routes`)
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const results = []

const MATRIX = SCHEMES.flatMap((scheme) => [
  [1440, 900, `desktop-${scheme}`, scheme],
  [390, 844, `mobile-${scheme}`, scheme],
])

for (const [w, h, tag, scheme] of MATRIX) {
  for (const mode of MODES) {
    // Both halves of the theme: `colorScheme` for the OS preference and the
    // app's own stored preference, which outranks it. Either alone can render
    // the other theme and still be labelled with this one.
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    })
    await ctx.addInitScript(
      ([key, session, m, slug, theme, consentKey, consent]) => {
        window.localStorage.setItem(key, session)
        window.localStorage.setItem('@preferred_theme', theme)
        window.localStorage.setItem('@scaffald:app_mode', m)
        if (m === 'employer') window.localStorage.setItem('@scaffald:app_mode_org_slug', slug)
        window.localStorage.setItem(consentKey, consent)
      },
      [storageKey, JSON.stringify(data.session), mode, EMPLOYER_ORG, scheme, COOKIE_CONSENT_KEY, cookieConsentValue()],
    )
    const page = await ctx.newPage()
    const consoleErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160))
    })
    page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 160)))
    // A 4xx/5xx says which request failed; the console's "Failed to load
    // resource" line does not.
    page.on('response', (r) => {
      if (r.status() >= 400) consoleErrors.push(`HTTP ${r.status()} ${r.url().replace(BASE, '').slice(0, 120)}`)
    })

    for (const route of routes) {
      if (!modesFor(route).includes(mode)) continue
      const before = consoleErrors.length
      const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '--')
      const file = `${OUT}/${tag}--${mode}--${slug}.png`
      const expected = expectedTheme(route, scheme)
      const row = { tag, scheme, expected, mode, route, file: relative(OUT, file) }
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 180000 })
        const ready = await waitForAppReady(page)
        // Strip Expo's dev overlay (a sibling of #root) so it cannot cover the app.
        await page.evaluate(() => {
          for (const el of [...document.body.children]) if (el.id !== 'root') el.remove()
        })
        const facts = await frameFacts(page)
        await page.waitForTimeout(300)
        await page.screenshot({ path: file, fullPage: false })
        // Light ground on a dark capture (or the reverse): the stamp said one
        // thing and the tree painted another. Transparent grounds are skipped.
        const lum = luminance(facts.bodyBg)
        const groundMismatch = lum !== null && (expected === 'dark' ? lum > 0.4 : lum < 0.2)
        const errors = consoleErrors.slice(before)
        // The server can die after `goto` resolves: the page half-loads, the
        // theme never stamps, and the capture reads as a theme failure. Not
        // ready plus an unreachable-server error is the dead server, not the app.
        const unreachable = errors.find((e) => isServerGone(e))
        if (!ready && unreachable) throw new Error(unreachable)
        Object.assign(row, facts, { ready, groundMismatch, errors })
      } catch (e) {
        // A dead dev server is not a finding about this route. Metro OOMs
        // partway through a long run (#680), and the first version of this
        // harness recorded the rest of the sweep as ~140 route failures —
        // indistinguishable from real ones, and the natural response
        // (re-run and see) is how a real failure gets waved through.
        if (isServerGone(e)) {
          console.error(
            `\n  Dev server stopped answering at ${route} (${results.length} of the run done).\n` +
              '  This is NOT a sweep finding — most likely Metro out of heap (#680).\n' +
              `  Restart it and re-run, narrowing with SWEEP_ONLY=${route.split('/')[1] ? '/' + route.split('/')[1] : '/'}.\n`,
          )
          writeFileSync(join(OUT, 'sweep.json'), JSON.stringify(results, null, 1))
          console.error(`  ${results.length} captures already written to ${OUT}/sweep.json.\n`)
          await browser.close()
          process.exit(EXIT_INFRA)
        }
        Object.assign(row, { failed: String(e).slice(0, 160), errors: consoleErrors.slice(before) })
      }
      results.push(row)
      // Write as we go. Metro OOMs partway through a long run (#680) and the
      // report used to be written only at the end, so a crash at capture 150
      // lost all 150. The PNGs were already on disk; the facts that make them
      // readable were not.
      writeFileSync(join(OUT, 'sweep.json'), JSON.stringify(results, null, 1))
      const flags = [
        row.failed ? 'FAILED' : null,
        row.landed && row.landed !== route ? `→ ${row.landed}` : null,
        row.hScroll ? 'H-SCROLL' : null,
        row.clipped?.length ? `CLIPPED(${row.clipped.length})` : null,
        row.renderedTheme && row.renderedTheme !== expected ? `THEME=${row.renderedTheme}` : null,
        row.groundMismatch ? `GROUND ${row.bodyBg}` : null,
        row.ready === false ? 'NOT-READY' : null,
        row.textLen != null && row.textLen < 200 ? 'THIN' : null,
        row.errors?.length ? `${row.errors.length} console err` : null,
      ].filter(Boolean)
      console.log(`${tag.padEnd(7)} ${mode.padEnd(8)} ${route.padEnd(44)} ${flags.join(' · ')}`)
    }
    await ctx.close()
  }
}
await browser.close()

writeFileSync(join(OUT, 'sweep.json'), JSON.stringify(results, null, 1))
const md = [
  `# Route sweep — ${new Date().toISOString().slice(0, 10)}`,
  '',
  `${results.length} captures across ${routes.length} routes. Base ${BASE}.`,
  '',
  '| Route | Mode | Capture | Landed | Title (x,y) | H-scroll | Clipped | Theme | Console errors |',
  '|---|---|---|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| \`${r.route}\` | ${r.mode} | ${r.tag} | ${r.failed ? 'FAILED' : r.landed === r.route ? '' : r.landed} | ${
        r.title ? `${r.title} (${r.titleX},${r.titleY})` : '—'
      } | ${r.hScroll ? 'yes' : ''} | ${r.clipped?.map((c) => c.text).join('; ') || ''} | ${
        r.renderedTheme === r.expected && !r.groundMismatch ? '' : `${r.renderedTheme ?? ''} ${r.groundMismatch ? r.bodyBg : ''}`
      } | ${r.errors?.length || ''} |`,
  ),
]
writeFileSync(join(OUT, 'sweep.md'), md.join('\n') + '\n')
console.log(`\nwrote ${results.length} captures, sweep.json and sweep.md to ${OUT}`)

// A capture labelled dark that rendered light manufactures confidence in the
// half of the palette least looked at, so it fails the run rather than warning.
// Public routes are expected light on both passes (see LIGHT_ONLY above).
const wrongTheme = results.filter((r) => r.renderedTheme && r.renderedTheme !== r.expected)
if (wrongTheme.length > 0) {
  console.log('\n--- THEME ASSERTION FAILED ---')
  for (const r of wrongTheme) console.log(`  ${r.tag} ${r.mode} ${r.route}: rendered ${r.renderedTheme}`)
}
// `finish` re-checks the server before reporting failure, so a death after the
// last capture still exits INFRA rather than 1.
await finish(BASE, wrongTheme.length > 0)
