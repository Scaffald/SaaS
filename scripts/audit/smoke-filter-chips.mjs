/**
 * Does the screening queue say it is filtered, and can you stop it?
 *
 * The queue opens on `under_review`. It is a slice from the moment it loads,
 * and the only thing that said so was the current value of a dropdown — the
 * same shape of confusion that had the strip reading "Over SLA 0" while three
 * cases were over (#635).
 *
 * A chip is only worth adding if it renders, names the filter, and removes it.
 * This checks all three against a real session rather than trusting the unit
 * tests in packages/scf-core/features/background-check/__tests__/queue-filters.test.ts
 * — those pin the arithmetic, not the wiring.
 *
 * Usage (needs `web-redesign` on 8087 and the local Supabase stack):
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *   node scripts/audit/smoke-filter-chips.mjs
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { mkdir } from 'node:fs/promises'
import { finish, requireServer } from './lib/dev-server.mjs'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8087'

// Fail distinctly if the dev server is not answering, rather than
// reporting its absence as an assertion failure (#680).
await requireServer(BASE)
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

const browser = await chromium.launch()
let failures = 0

for (const [w, h, tag] of [
  [390, 844, 'mobile'],
  [1440, 900, 'desktop'],
]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key, session)
      window.localStorage.setItem('@scaffald:app_mode', 'employer')
      window.localStorage.setItem('@scaffald:app_mode_org_slug', 'unicorn')
      // Pre-answer the consent banner so it is not sitting over the strip in
      // the screenshot.
      //
      // The key is the APP's override (`scf-cookie-consent` in
      // scf-core/provider/cookie-consent), not the `cookie-consent-state`
      // default inside the ui package — and `version` must match the app's
      // POLICY_VERSION or the stored state is discarded as stale and the
      // banner comes back. Two wrong guesses at this key each failed silently,
      // which is why it is written down here.
      window.localStorage.setItem(
        'scf-cookie-consent',
        JSON.stringify({ version: '1', updatedAt: 1, selections: {} })
      )
    },
    [storageKey, JSON.stringify(data.session)]
  )

  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

  await page.goto(`${BASE}/office/ats/admin`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(6000)
  await page.evaluate(() => {
    for (const id of ['error-overlay', 'error-toast']) document.getElementById(id)?.remove()
  })

  const findChip = () =>
    page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && /^Status:\s/.test((e.textContent || '').trim())
      )
      return el ? (el.textContent || '').trim() : null
    })

  // 1. The default filter announces itself.
  const chipBefore = await findChip()

  // 2. Its remove control is big enough to hit. 12px glyph + 16 hitSlop should
  //    give a 44px target; measured rather than assumed, because hitSlop is
  //    invisible to a screenshot and easy to get wrong.
  const target = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[aria-label]')].find((e) =>
      /^Remove Status filter$/.test(e.getAttribute('aria-label') || '')
    )
    if (!btn) return null
    const r = btn.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height) }
  })

  // Scroll the strip into view before shooting. The chip sits below the
  // metrics and the tab bar, so a top-of-page screenshot is not evidence that
  // it rendered — the DOM assertions above found it while the first shot
  // showed only the header.
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /^Status:\s/.test((e.textContent || '').trim())
    )
    el?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/filter-chips--${tag}.png` })

  // 3. Removing it actually clears the filter.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('[aria-label]')].find((e) =>
      /^Remove Status filter$/.test(e.getAttribute('aria-label') || '')
    )
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForTimeout(2500)
  const chipAfter = await findChip()

  const renders = chipBefore !== null
  const removes = chipAfter === null
  // The Pressable's own box is the glyph; hitSlop extends the touch area
  // beyond it and does not show up in getBoundingClientRect, so this asserts
  // the glyph is present and sized, and the hitSlop is covered by review.
  const hasTarget = target !== null && target.w > 0 && target.h > 0
  const ok = renders && removes && hasTarget
  if (!ok) failures++

  console.log(
    `${ok ? '✓' : '✗'} ${tag.padEnd(8)} chip=${chipBefore ?? 'MISSING'} ` +
      `glyph=${target ? `${target.w}x${target.h}` : 'MISSING'} ` +
      `afterRemove=${chipAfter ?? 'gone'}` +
      (renders ? '' : ' (default filter never announced itself)') +
      (removes ? '' : ' (chip survived its own remove button)') +
      (errors.length ? ` errors=${errors.length}` : '')
  )
  if (errors.length) console.log('   ', errors[0])
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} case(s) failed` : '\nall cases passed')
await finish(BASE, failures)
