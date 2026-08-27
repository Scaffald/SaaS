/**
 * Does a wide table survive a phone?
 *
 * `Table` scrolls horizontally below its natural width. That is the same answer
 * the kanban board gave to "more stages" — sideways scrolling that hides work —
 * and the reason Lanes exists. A table row on a 390px screen shows two of its
 * seven columns and buries the rest off-frame, where nothing hints they are
 * there.
 *
 * This measures the overflow rather than eyeballing it: how much wider the
 * table's own content is than the viewport, and how many columns are actually
 * on screen at once.
 *
 * Usage (needs `web-redesign` on 8087 and the local Supabase stack):
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *   node scripts/audit/smoke-wide-tables.mjs
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
const TAG = process.env.SMOKE_TAG || 'before'

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
      window.localStorage.setItem(
        'scf-cookie-consent',
        JSON.stringify({ version: '1', updatedAt: 1, selections: {} })
      )
    },
    [storageKey, JSON.stringify(data.session)]
  )

  const page = await ctx.newPage()
  await page.goto(`${BASE}/office/ats/admin`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(6000)
  await page.evaluate(() => {
    for (const id of ['error-overlay', 'error-toast']) document.getElementById(id)?.remove()
  })

  // Measure the TABLE, not the page.
  //
  // The first version took the worst-overflowing div anywhere on the page. It
  // reported 55px after the fix and I nearly filed that as a leftover — it is
  // the breadcrumb and the tab strip, both of which scroll sideways by their
  // own design and have nothing to do with this change. A measurement that
  // cannot say WHICH element it measured is not evidence about the table.
  //
  // So: find an element containing a known column label, then walk up to the
  // nearest ancestor that actually scrolls.
  const measured = await page.evaluate(() => {
    const anchor = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && (e.textContent || '').trim() === 'Organization'
    )
    if (!anchor) return null

    // Walk up only as far as the row, not to the page.
    //
    // An earlier version climbed until it found ANY overflowing ancestor. It
    // reported 39px twice and I twice tried to fix the table — but tracing the
    // chain showed every ancestor of the card at over:0. The walk was escaping
    // the table entirely and landing on page chrome (the breadcrumb and the
    // tab strip both scroll sideways by their own design). A measurement that
    // can wander outside the thing under test is not evidence about it.
    let worst = { over: 0, scrollWidth: 0, clientWidth: 0 }
    let el = anchor.parentElement
    for (let i = 0; el && i < 6; el = el.parentElement, i++) {
      const over = el.scrollWidth - el.clientWidth
      if (over > worst.over) {
        worst = { over, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
      }
    }
    return worst
  })

  // The symptom a person actually sees: content past the right edge.
  //
  // Split by whether it belongs to the TABLE or to page chrome. The breadcrumb
  // and the tab strip both clip on a phone and both did so before this change
  // — failing the table smoke on them would make it permanently red for a
  // reason it does not own. They are reported, not asserted, and filed
  // separately.
  const clipping = await page.evaluate(() => {
    const anchor = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && (e.textContent || '').trim() === 'Organization'
    )
    // Six levels up from a cell is comfortably inside the table and nowhere
    // near the page shell — the same bound the overflow walk uses.
    let tableRoot = anchor?.parentElement ?? null
    for (let i = 0; tableRoot?.parentElement && i < 6; i++) tableRoot = tableRoot.parentElement

    const inTable = []
    const chrome = []
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue
      const t = (el.textContent || '').trim()
      if (!t) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right <= window.innerWidth + 1) continue
      ;(tableRoot?.contains(el) ? inTable : chrome).push(t.slice(0, 30))
    }
    return { inTable, chrome }
  })
  const clipped = clipping.inTable

  // How many distinct column headings are visible without scrolling?
  const headings = await page.evaluate(() => {
    const seen = []
    for (const el of document.querySelectorAll('*')) {
      if (el.children.length !== 0) continue
      const t = (el.textContent || '').trim()
      if (!t || t.length > 24) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.left < 0 || r.right > window.innerWidth) continue
      seen.push(t)
    }
    return seen
  })

  const wanted = ['Worker', 'Organization', 'Status', 'Package']
  const onScreen = wanted.filter((c) => headings.includes(c))

  // Shoot the table, not the top of the page. The first version framed the
  // masthead and the metrics strip — the thing under test was below the fold,
  // so the image proved nothing either way.
  await page.evaluate(() => {
    const anchor = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && (e.textContent || '').trim() === 'Organization'
    )
    anchor?.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/wide-table--${tag}--${TAG}.png` })

  const overflow = measured?.over ?? 0
  // Desktop keeps the grid and is allowed to scroll sideways. The phone is the
  // case under test: a stacked row must not overflow, and no cell may sit past
  // the right edge of the screen.
  // Page chrome is asserted now too.
  //
  // It was reported-not-asserted while #664 was open: the breadcrumb and the
  // tab strip both clipped, both pre-dated the table work, and failing a table
  // smoke on them would have made it permanently red for something it did not
  // own. #664 is fixed, so this holds them to the same bar as the table.
  const ok =
    tag === 'desktop'
      ? true
      : overflow === 0 &&
        clipped.length === 0 &&
        clipping.chrome.length === 0 &&
        onScreen.length === wanted.length
  if (!ok) failures++

  console.log(
    `${ok ? '✓' : '✗'} ${tag.padEnd(8)} rowOverflow=${overflow}px ` +
      `(row ${measured?.scrollWidth ?? '?'} in ${measured?.clientWidth ?? '?'}) ` +
      `columnsOnScreen=${onScreen.length}/${wanted.length} ` +
      `tableClipped=${clipped.length}` +
      (ok
        ? ''
        : ` ← ${clipped.length ? `clipped: ${clipped.slice(0, 3).join(' | ')}` : 'the row still scrolls sideways'}`)
  )
  if (clipping.chrome.length) {
    console.log(
      `    (page chrome also clips, unrelated to this table: ${clipping.chrome.slice(0, 3).join(' | ')})`
    )
  }
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} case(s) failed` : '\nall cases passed')
process.exit(failures ? 1 : 0)
