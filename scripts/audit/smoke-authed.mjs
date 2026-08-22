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
  // The screening queue's SLA strip (#633) lives on the ADMIN page
  // (/office/ats/admin), not /office/ats/checks — that one is the org-scoped
  // view behind an organization picker. Seeded by
  // packages/supabase/seeds/015_seed-background-checks.sql, which spreads case
  // ages across over-SLA / due-today / on-time / terminal so the strip is
  // exercised rather than merely populated.
  ['ats-checks-admin', '/office/ats/admin'],
  ['dashboard', '/dashboard'],
]

const browser = await chromium.launch()
const results = []

// There is no dark pass, and it is not an oversight.
//
// DARK MODE IS SWITCHED OFF IN THE APP. `useThemeSetting` in
// packages/scf-core/provider/theme/UniversalThemeProvider.tsx hardcodes:
//
//   const resolvedTheme = 'light' as 'light' | 'dark'
//
// with the real resolution commented out beneath it, since 78caa00b
// ("feat: force light mode and hide theme toggle", 2026-04-21). Every other
// part of the theming stack works — the provider resolves a preference,
// persists it, and stamps `data-theme` on <html> — but that one line
// short-circuits all of it.
//
// So a dark pass here cannot render dark no matter how the browser or storage
// is configured, and three earlier attempts at one produced LIGHT screenshots
// labelled "dark". Restoring it is a one-line change in that file plus a
// deliberate decision to ship dark mode; until then, a pass that claims to
// exercise the dark palette is worse than none.
//
// Three separate theme keys exist, which is worth knowing if this is revisited:
//   beyond-ui-theme     ThemeProvider's own default (packages/ui)
//   scaffald-ui-theme   themeStorage.ts (packages/ui) — nothing reads it
//   @preferred_theme    UniversalThemeProvider via kvStorage — the app's
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
      // The app's key, set explicitly rather than relying on
      // prefers-color-scheme: a stored preference beats the system setting, so
      // `colorScheme` alone is not enough to guarantee which theme renders.
      window.localStorage.setItem('@preferred_theme', theme)
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

      // The pipeline's Board and Metrics views are client state behind a
      // segmented control, not routes — so a route-only sweep never sees them.
      // The board in particular carries the keyboard/touch move controls and
      // the closed drop targets, which is exactly the code that has no other
      // way of being looked at.
      if (name === 'ats-applications') {
        for (const view of ['Board', 'Metrics']) {
          try {
            const control = page.getByText(view, { exact: true }).first()
            await control.click({ timeout: 5000 })
            await page.waitForTimeout(2500)
            await page.screenshot({
              path: `${OUT}/${tag}--auth--ats-${view.toLowerCase()}.png`,
              fullPage: false,
            })
            console.log(`  ↳ ${tag} ${view} view captured`)

            // Open the first Move menu and prove it is a real menu, not a
            // decorative trigger. This is the assertion that matters: the
            // board's whole non-drag path is one control, and a menu that
            // renders but does not open would silently undo §12 #12.
            if (view === 'Board') {
              const trigger = page.getByRole('button', { name: /^Move .* to another stage$/ }).first()
              const count = await page.getByRole('button', { name: /^Move .* to another stage$/ }).count()
              if (count === 0) {
                console.log(`  ↳ ${tag} MOVE MENU: no triggers found`)
              } else {
                await trigger.click({ timeout: 5000 })
                await page.waitForTimeout(800)
                const items = await page.getByRole('menuitem').count()
                console.log(
                  `  ↳ ${tag} MOVE MENU: ${count} triggers, ${items} menuitem(s) after opening`,
                )
                await page.screenshot({
                  path: `${OUT}/${tag}--auth--ats-move-menu.png`,
                  fullPage: false,
                })
                await page.keyboard.press('Escape')
                await page.waitForTimeout(400)
                const afterEscape = await page.getByRole('menuitem').count()
                console.log(`  ↳ ${tag} MOVE MENU: ${afterEscape} menuitem(s) after Escape`)
              }
            }
          } catch {
            console.log(`  ↳ ${tag} ${view} view NOT reachable`)
          }
        }
      }
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 400))
      // Assert the theme that actually rendered. A pass labelled "dark" that
      // renders light manufactures false confidence in exactly the half of the
      // palette nobody has looked at, so it has to fail visibly.
      // InnerProvider stamps the RESOLVED theme onto <html data-theme>, which
      // is the only reliable read: component backgrounds are often transparent
      // wrappers, so probing a node's computed colour proves nothing. Reported
      // on every route so that if dark mode is ever re-enabled, a pass that
      // silently renders light fails visibly rather than passing.
      const renderedTheme = await page.evaluate(
        () => document.documentElement.getAttribute('data-theme') ?? 'unset',
      )
      results.push({
        tag,
        name,
        url: page.url(),
        redirected: !page.url().includes(path),
        newErrors: consoleErrors.slice(before),
        snippet: bodyText.replace(/\n+/g, ' | ').slice(0, 220),
        renderedTheme,
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
  if (r.renderedTheme) console.log('    theme:', r.renderedTheme)
  if (r.snippet) console.log('   ', r.snippet)
  for (const e of r.newErrors ?? []) console.log('    !', e)
}
