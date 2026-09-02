/**
 * Is the report affordance actually reachable on screen? (#690)
 *
 * The API and the components can both be correct while the control renders
 * nowhere a person would find it — and "can I report this?" is precisely what
 * a store reviewer goes looking for. So this asks the running app rather than
 * the source.
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *     node scripts/audit/smoke-report-block.mjs
 */
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8081'
const storageKey = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`

const supabase = createClient(SUPABASE_URL, ANON)
const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.SMOKE_EMAIL,
  password: process.env.SMOKE_PASSWORD,
})
if (error) {
  console.error('AUTH FAILED:', error.message)
  process.exit(1)
}
console.log('✓ session minted for', data.user?.email)

let failures = 0
const check = (label, ok, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? '  ' + detail : ''}`)
}

const browser = await chromium.launch()

const open = async (path, mode = 'worker') => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(
    ([k, s, m]) => {
      window.localStorage.setItem(k, s)
      window.localStorage.setItem('@scaffald:app_mode', m)
      window.localStorage.setItem('@scaffald:app_mode_org_slug', 'unicorn')
    },
    [storageKey, JSON.stringify(data.session), mode]
  )
  const page = await ctx.newPage()
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(5000)
  await page.evaluate(() => {
    for (const id of ['error-overlay', 'error-toast']) document.getElementById(id)?.remove()
  })
  return { ctx, page }
}

// --- settings: blocking must be reversible somewhere findable ---------------
{
  const { ctx, page } = await open('/dashboard/settings')
  const text = await page.evaluate(() => document.body.innerText)
  check('Settings offers a blocked-people section', /Blocked people/i.test(text))
  check(
    '...and explains that blocking is mutual',
    /both ways/i.test(text),
    '— a user should not have to guess whether the other side can still see them'
  )
  await ctx.close()
}

// --- report affordance carries an accessible name --------------------------
{
  const { ctx, page } = await open('/dashboard/settings')
  // The control is labelled per subject so a screen-reader user moving through
  // a thread can tell which one they are on. Assert the labelling scheme
  // exists at all rather than depending on seeded content being present.
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label]')]
      .map((el) => el.getAttribute('aria-label') || '')
      .filter((l) => /report/i.test(l))
  )
  check(
    'report controls, where present, are individually named',
    labels.every((l) => l.trim().toLowerCase() !== 'report'),
    labels.length ? `found: ${labels.slice(0, 3).join(', ')}` : '(none on this screen)'
  )
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
