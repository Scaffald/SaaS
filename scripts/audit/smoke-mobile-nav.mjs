/**
 * Does the phone bottom bar mirror the role you are in?
 *
 * Employer mode used to render NO bottom bar at all — an employer on a phone
 * had no primary navigation, every move going through the drawer behind the
 * header avatar. The unit tests in
 * packages/scf-core/features/drawer/__tests__/mobile-sections.test.ts pin the
 * tab sets, but a config that is correct and a bar that renders are different
 * claims, and it was exactly that gap that hid the empty-lane density bug.
 *
 * So this asserts on the rendered DOM: how many tabs, which labels, and which
 * one is lit — once per mode.
 *
 * Usage (needs `web-redesign` running on 8087 and the local Supabase stack):
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *   node scripts/audit/smoke-mobile-nav.mjs
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { mkdir } from 'node:fs/promises'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8087'
const EMAIL = process.env.SMOKE_EMAIL
const PASSWORD = process.env.SMOKE_PASSWORD
const OUT = process.env.SMOKE_OUT || 'docs/plans/redesign/shots-current'

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

await mkdir(OUT, { recursive: true })

// Landing route per mode, and the tab we expect it to light.
const CASES = [
  {
    mode: 'worker',
    path: '/dashboard',
    expectTabs: ['Home', 'Jobs', 'Community'],
    expectActive: 'Home',
    expectRole: 'Worker',
  },
  {
    mode: 'employer',
    path: '/office/applications',
    expectTabs: ['Talent', 'Apps', 'Jobs', 'Screening'],
    expectActive: 'Apps',
    expectRole: 'Employer',
  },
  {
    // Deep in the ATS cluster, not on /checks itself — the tab should still be
    // lit, which is the matchPrefixes: ['/office/ats'] decision.
    mode: 'employer',
    path: '/office/ats/admin',
    expectTabs: ['Talent', 'Apps', 'Jobs', 'Screening'],
    expectActive: 'Screening',
    expectRole: 'Employer',
  },
]

const browser = await chromium.launch()
let failures = 0

for (const c of CASES) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  await ctx.addInitScript(
    ([key, session, mode]) => {
      window.localStorage.setItem(key, session)
      // AsyncStorage is localStorage on web; this is the key useAppMode reads.
      window.localStorage.setItem('@scaffald:app_mode', mode)
      window.localStorage.setItem('@scaffald:app_mode_org_slug', 'unicorn')
    },
    [storageKey, JSON.stringify(data.session), c.mode]
  )

  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

  await page.goto(BASE + c.path, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(5000)

  // Expo's dev error overlay is a dev-server artifact, not part of the app.
  await page.evaluate(() => {
    for (const id of ['error-overlay', 'error-toast']) {
      document.getElementById(id)?.remove()
    }
  })

  // The bar is the only thing pinned to the bottom carrying tab labels. Read
  // it by role rather than by class, so a styling change does not silently
  // turn this check green against nothing.
  const observed = await page.evaluate(
    (labels) => {
      const hits = []
      for (const el of document.querySelectorAll('[role="tab"], [role="button"], a')) {
        const t = (el.textContent || '').trim()
        if (!labels.includes(t)) continue
        const r = el.getBoundingClientRect()
        // Bottom third of the viewport: the tab bar, not a link in page content.
        if (r.top < window.innerHeight * 0.66) continue
        hits.push({
          label: t,
          selected:
            el.getAttribute('aria-selected') === 'true' ||
            el.getAttribute('aria-current') === 'page',
          x: Math.round(r.x),
        })
      }
      hits.sort((a, b) => a.x - b.x)
      return hits
    },
    [...new Set(CASES.flatMap((x) => x.expectTabs))]
  )

  // Is the bar actually reachable, or is something sitting on top of it?
  //
  // The consent banner is absolutely positioned at the bottom with zIndex 1000
  // and used to land squarely on the tab bar, burying the app's primary
  // navigation until somebody dismissed it. That overlap survived several
  // passes of looking at these very screenshots, so this asks the question by
  // hit-testing rather than by eye.
  //
  // Geometry comparison was tried first and is the wrong tool: the banner's
  // absolutely-positioned wrapper is transparent and its opaque card is
  // statically positioned, so a scan for "absolute element with a background
  // overlapping the bar" matches neither and reports all-clear. elementFromPoint
  // asks what the user's finger would actually land on.
  const covered = await page.evaluate(() => {
    const out = []
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      const r = tab.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      if (!hit) continue
      // The hit is fine if it IS the tab, sits inside it (icon/label), or is an
      // ancestor wrapper the tab paints within.
      if (tab.contains(hit) || hit.contains(tab)) continue
      out.push({
        tab: (tab.textContent || '').trim(),
        by: (hit.textContent || '').trim().slice(0, 40),
      })
    }
    return out
  })

  const overlapOk = covered.length === 0
  if (!overlapOk) failures++

  // The masthead avatar opens the account sheet, and the bar's More opens the
  // drawer. Those two moved together on purpose: the avatar used to be the ONLY
  // way to open the drawer on a phone, so repointing it without adding More
  // would have stranded profile, settings and organizations behind nothing.
  // Both doors are checked here, because "the sheet works" and "the drawer is
  // still reachable" are separate claims.
  const doors = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const byLabel = (needle) =>
      [...document.querySelectorAll('[aria-label]')].find((el) =>
        (el.getAttribute('aria-label') || '').toLowerCase().includes(needle)
      )
    const click = (el) => el?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // Account sheet, via the avatar.
    click(byLabel('account and role'))
    await wait(600)
    const sheet = [...document.querySelectorAll('*')].some((el) =>
      (el.textContent || '').includes('Using Scaffald as')
    )
    // Every row in the sheet is a menuitem, but only the context rows under
    // "Using Scaffald as" carry aria-selected — Notifications and Sign out are
    // actions, not roles, and lumping them together made this line read as if
    // "Notifications" were something you could be.
    const roleRows = [...document.querySelectorAll('[role="menuitem"][aria-selected]')].map(
      (el) => {
        const label = (el.textContent || '').trim()
        return el.getAttribute('aria-selected') === 'true' ? `${label}*` : label
      }
    )
    // Close it again so the drawer probe is not clicking through a scrim.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await wait(500)

    // Drawer, via More.
    const more = byLabel('more')
    click(more)
    await wait(600)
    const drawer = [...document.querySelectorAll('*')].some((el) => {
      const t = (el.textContent || '').trim()
      return t === 'Settings' || t === 'Profile'
    })

    return { moreExists: !!more, sheet, roleRows, drawer }
  })

  // The sheet must agree with the bar about which context you are in — the two
  // read the same `useAppMode`, so a disagreement means one of them is stale.
  const sheetAgrees = doors.roleRows.some((r) => r.endsWith('*') && r.startsWith(c.expectRole))
  const doorsOk = doors.moreExists && doors.sheet && doors.drawer && sheetAgrees
  if (!doorsOk) failures++

  const tabs = observed.map((o) => o.label)
  const active = observed.find((o) => o.selected)?.label ?? null

  const tabsOk = JSON.stringify(tabs) === JSON.stringify(c.expectTabs)
  const activeOk = active === c.expectActive
  if (!tabsOk || !activeOk) failures++

  const shot = `${OUT}/mobile-nav--${c.mode}--${c.path.replace(/\W+/g, '-').replace(/^-|-$/g, '')}.png`
  await page.screenshot({ path: shot })

  console.log(
    `${tabsOk && activeOk && overlapOk && doorsOk ? '✓' : '✗'} ${c.mode.padEnd(8)} ${c.path.padEnd(22)} ` +
      `tabs=[${tabs.join(', ')}] active=${active}` +
      ` sheet=${doors.sheet ? 'opens' : 'NO'}` +
      ` roles=[${doors.roleRows.join(', ')}]` +
      ` drawer-via-More=${doors.moreExists ? (doors.drawer ? 'opens' : 'NO') : 'NO MORE TAB'}` +
      (tabsOk ? '' : ` (expected [${c.expectTabs.join(', ')}])`) +
      (activeOk ? '' : ` (expected active ${c.expectActive})`) +
      (overlapOk ? '' : ` COVERED: ${covered.map((c) => `${c.tab}<-"${c.by}"`).join(', ')}`) +
      (errors.length ? ` errors=${errors.length}` : '')
  )
  if (errors.length) console.log('   ', errors[0])
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} case(s) failed` : '\nall cases passed')
process.exit(failures ? 1 : 0)
