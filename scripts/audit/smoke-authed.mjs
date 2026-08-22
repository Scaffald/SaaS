/**
 * Authenticated smoke test for the app's protected screens.
 *
 * Why this exists: every ATS screen sits behind auth and the `office` role, so
 * none of the redesign work could be seen rendering. Storybook covers the
 * primitives in isolation, but not a real screen against real data.
 *
 * It mints a session exactly the way the repo's own Playwright auth setup does
 * (tests/infrastructure/playwright/setup/setup/auth.setup.ts) — programmatically
 * through supabase-js against the LOCAL stack, then injects it into
 * localStorage under the key supabase-js actually reads. No login form is
 * driven and no credential is typed anywhere.
 *
 * Local development only. It points at 127.0.0.1 by default and the seeded
 * accounts only exist there.
 *
 * Prerequisites:
 *   pnpm supa start
 *   pnpm supa functions serve api
 *   a dev server (see .claude/launch.json)
 *
 * Usage:
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=zach@unicorn.love SMOKE_PASSWORD=password123 \
 *   node scripts/audit/smoke-authed.mjs
 *
 * Writes screenshots to docs/plans/redesign/shots-current/ and prints a
 * per-route summary of console errors and redirects.
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8087'
const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD
const OUT = process.env.SMOKE_OUT || 'docs/plans/redesign/shots-current'

// Same derivation as auth.setup.ts: first hostname label, not the full host.
const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`

const supabase = createClient(SUPABASE_URL, ANON)
const { data, error } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})
if (error) {
  console.error('AUTH FAILED:', error.message)
  process.exit(1)
}
console.log('✓ session minted for', data.user?.email)

const ROUTES = [
  ['ats-applications', '/office/applications'],
  ['ats-metrics', '/office/ats/metrics'],
  ['dashboard', '/dashboard'],
]

const browser = await chromium.launch()
const results = []

// TODO(dark mode): dark is a first-class theme and theme-dependent colours —
// chart series especially — are exactly what breaks in only one of them. Two
// attempts at a dark pass both rendered LIGHT and were removed rather than
// shipped: Playwright's `colorScheme` does nothing (the app reads its own
// context, not prefers-color-scheme), and seeding `scaffald-ui-theme` in
// localStorage did not take either. Whatever drives ThemeProvider on web needs
// finding first. A pass labelled "dark" that renders light is worse than no
// pass — it manufactures false confidence in the half of the palette nobody
// has looked at.
for (const [w, h, tag, scheme] of [
  [1440, 900, 'desktop', 'light'],
  [390, 844, 'mobile', 'light'],
]) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    colorScheme: scheme,
  })
  // Seed the session before any app code runs.
  //
  // The theme goes in alongside it: the app reads its theme from its own
  // storage (`scaffald-ui-theme`), NOT from prefers-color-scheme, so
  // Playwright's `colorScheme` alone renders light and a "dark" pass that
  // only sets it is silently testing light twice.
  await ctx.addInitScript(
    ([key, session, theme]) => {
      window.localStorage.setItem(key, session)
      window.localStorage.setItem('scaffald-ui-theme', theme)
    },
    [storageKey, JSON.stringify(data.session), scheme],
  )

  const page = await ctx.newPage()
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200))
  })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 200)))

  for (const [name, path] of ROUTES) {
    const before = consoleErrors.length
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 })
      await page.waitForTimeout(5000)
      // Dismiss Expo's dev-only error overlay so it does not cover the UI.
      // It is a dev-server artifact, not part of the app.
      const overlayInfo = await page.evaluate(() => {
        // Expo's dev-server error overlay (#error-toast / #error-overlay) is a
        // sibling of #root, not part of the app. Strip everything but the app
        // root so a dev-only overlay cannot cover the UI being reviewed.
        const hits = []
        const scan = (root, depth) => {
          if (depth > 4) return
          for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
              hits.push('SHADOW:' + el.tagName.toLowerCase())
              scan(el.shadowRoot, depth + 1)
            }
          }
        }
        scan(document, 0)
        const byText = [...document.querySelectorAll('body > *')].map(
          (e) => e.tagName.toLowerCase() + '#' + (e.id || '') + '.' + (e.className || '').toString().slice(0, 40),
        )
        // Remove anything that is not the app root.
        for (const el of [...document.body.children]) {
          if (el.id !== 'root') el.remove()
        }
        return { shadowHosts: hits.slice(0, 6), bodyChildren: byText }
      })
      if (name === 'ats-applications' && tag === 'desktop') console.log('  overlay probe:', JSON.stringify(overlayInfo))
      await page.waitForTimeout(500)
      const file = `${OUT}/${tag}--auth--${name}.png`
      await page.screenshot({ path: file, fullPage: false })
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400))
      results.push({
        tag,
        name,
        url: page.url(),
        redirected: !page.url().includes(path),
        newErrors: consoleErrors.slice(before),
        snippet: bodyText.replace(/\n+/g, ' | ').slice(0, 220),
      })
      console.log(`✓ ${tag} ${name} -> ${page.url()}`)
    } catch (e) {
      results.push({ tag, name, error: String(e).split('\n')[0] })
      console.log(`✗ ${tag} ${name}: ${String(e).split('\n')[0]}`)
    }
  }
  await ctx.close()
}

await browser.close()
console.log('\n--- SUMMARY ---')
for (const r of results) {
  console.log(
    `${r.tag}/${r.name}: ${r.error ? 'ERROR ' + r.error : (r.redirected ? 'REDIRECTED ' : 'ok ') + (r.newErrors?.length ? r.newErrors.length + ' console errors' : 'no console errors')}`,
  )
  if (r.snippet) console.log('   ', r.snippet)
  for (const e of r.newErrors ?? []) console.log('    !', e)
}
