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
 * Local only. Needs `pnpm supa start`, the `api` function served, and a dev
 * server (see .claude/launch.json).
 *
 *   SWEEP_BASE_URL=http://localhost:8081 \
 *   SWEEP_EMAIL=zach@unicorn.love SWEEP_PASSWORD=password123 \
 *   node scripts/audit/sweep-routes.mjs
 *
 * Optional: SWEEP_ONLY=/office,/profile (prefix filter), SWEEP_OUT=<dir>.
 * Writes PNGs plus sweep.json and sweep.md to the output directory.
 */

import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { EXIT_INFRA, isServerGone, requireServer } from './lib/dev-server.mjs'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SWEEP_BASE_URL || 'http://localhost:8081'
const OUT = process.env.SWEEP_OUT || 'docs/plans/redesign/shots-current'
const ONLY = (process.env.SWEEP_ONLY || '').split(',').filter(Boolean)
const EMPLOYER_ORG = process.env.SWEEP_ORG_SLUG || 'unicorn'

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
const routes = [...new Set(
  walk(APP_DIR).map((file) => {
    let r = '/' + relative(APP_DIR, file).replace(/\.tsx$/, '')
    r = r.replace(/\/\([^)]+\)/g, '').replace(/\/index$/, '')
    return r === '' ? '/' : r
  }),
)]
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

for (const [w, h, tag] of [
  [1440, 900, 'desktop'],
  [390, 844, 'mobile'],
]) {
  for (const mode of ['worker', 'employer']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
    await ctx.addInitScript(
      ([key, session, m, slug]) => {
        window.localStorage.setItem(key, session)
        window.localStorage.setItem('@preferred_theme', 'light')
        window.localStorage.setItem('@scaffald:app_mode', m)
        if (m === 'employer') window.localStorage.setItem('@scaffald:app_mode_org_slug', slug)
        // The cookie banner is a real screen element but not one under review.
        window.localStorage.setItem(
          'scf-cookie-consent',
          JSON.stringify({ version: '1', updatedAt: new Date().toISOString(), selections: { essential: true, analytics: false, marketing: false } }),
        )
      },
      [storageKey, JSON.stringify(data.session), mode, EMPLOYER_ORG],
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
      const row = { tag, mode, route, file: relative(OUT, file) }
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 180000 })
        await page.waitForTimeout(1500)
        const facts = await page.evaluate(() => {
          // Strip Expo's dev overlay (a sibling of #root) so it cannot cover the app.
          for (const el of [...document.body.children]) if (el.id !== 'root') el.remove()
          const doc = document.documentElement
          const heading = document.querySelector('h1, [aria-level="1"], h2, [aria-level="2"], [role="heading"]')
          const rect = heading ? heading.getBoundingClientRect() : null
          return {
            landed: location.pathname,
            hScroll: doc.scrollWidth > doc.clientWidth + 1,
            scrollWidth: doc.scrollWidth,
            textLen: document.body.innerText.length,
            title: heading ? heading.textContent.trim().slice(0, 60) : null,
            titleX: rect ? Math.round(rect.x) : null,
            titleY: rect ? Math.round(rect.y) : null,
          }
        })
        await page.waitForTimeout(300)
        await page.screenshot({ path: file, fullPage: false })
        Object.assign(row, facts, { errors: consoleErrors.slice(before) })
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
  '| Route | Mode | Width | Landed | Title (x,y) | H-scroll | Console errors |',
  '|---|---|---|---|---|---|---|',
  ...results.map(
    (r) =>
      `| \`${r.route}\` | ${r.mode} | ${r.tag} | ${r.failed ? 'FAILED' : r.landed === r.route ? '' : r.landed} | ${
        r.title ? `${r.title} (${r.titleX},${r.titleY})` : '—'
      } | ${r.hScroll ? 'yes' : ''} | ${r.errors?.length || ''} |`,
  ),
]
writeFileSync(join(OUT, 'sweep.md'), md.join('\n') + '\n')
console.log(`\nwrote ${results.length} captures, sweep.json and sweep.md to ${OUT}`)
