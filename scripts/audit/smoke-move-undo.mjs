/**
 * Does Undo actually stop the write?
 *
 * The claim in #643 is specific: a stage move is HELD for a few seconds and
 * Undo cancels it before it is ever sent. That is a claim about the network,
 * not about the screen — a toast that says "undone" while a PATCH is already
 * in flight is exactly the kind of convincing-looking lie this project keeps
 * finding. So this watches the wire.
 *
 * Two runs against a real session:
 *
 *   undo      move, press Undo, assert NO write went out and the row is back
 *   let it go move, wait past the window, assert the write DID go out
 *
 * The second half matters as much as the first: a queue that never fires would
 * pass the undo test perfectly.
 *
 * Usage (needs `web-redesign` on 8087 and the local Supabase stack):
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *   node scripts/audit/smoke-move-undo.mjs
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

/** Must match UNDO_WINDOW_MS in features/office/applications/pending-writes.ts. */
const UNDO_WINDOW_MS = 5000

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

/** Drive one move, then either undo it or let the window close. */
async function run(mode) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
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

  // The whole point of the test: every status write, as it leaves.
  const writes = []
  const t0 = Date.now()
  page.on('request', (req) => {
    const url = req.url()
    if (req.method() !== 'PATCH' && req.method() !== 'PUT' && req.method() !== 'POST') return
    if (!/applications/.test(url)) return
    let body = ''
    try {
      body = req.postData() ?? ''
    } catch {
      /* some requests have no readable body */
    }
    if (/status/.test(body) || req.method() === 'PATCH') {
      // Timestamped: two writes arriving together mean one call retried, two
      // writes a window apart mean the move was scheduled twice. Without this
      // the duplicate is just a number and the cause is a guess.
      writes.push(
        `+${String(Date.now() - t0).padStart(5)}ms ${req.method()} ${url.split('/').slice(-2).join('/')} ${body.slice(0, 60)}`
      )
    }
  })

  // Responses too, not just requests. Two writes 1.2s apart looked like a
  // duplicate; the status codes are what say whether it is one call being
  // retried after a failure or genuinely two moves.
  page.on('response', async (res) => {
    const req = res.request()
    if (req.method() !== 'PATCH' || !/applications/.test(res.url())) return
    let detail = ''
    try {
      detail = (await res.text()).slice(0, 120)
    } catch {
      /* body may be gone by the time we ask */
    }
    writes.push(`      ↳ ${res.status()} ${detail}`)
  })

  await page.goto(`${BASE}/office/applications`, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(6000)
  await page.evaluate(() => {
    for (const id of ['error-overlay', 'error-toast']) document.getElementById(id)?.remove()
  })

  // The Move menu lives on the Board view, which is client state behind a
  // segmented control rather than a route.
  await page.getByText('Board', { exact: true }).first().click({ timeout: 10000 })
  await page.waitForTimeout(2500)

  const triggers = page.getByRole('button', { name: /^Move .* to another stage$/ })
  const triggerCount = await triggers.count()
  if (triggerCount === 0) {
    console.log(`✗ ${mode.padEnd(9)} no Move triggers on the board — nothing to exercise`)
    await ctx.close()
    return false
  }

  await triggers.first().click({ timeout: 5000 })
  await page.waitForTimeout(800)

  const items = page.getByRole('menuitem')
  if ((await items.count()) === 0) {
    console.log(`✗ ${mode.padEnd(9)} Move menu opened no items`)
    await ctx.close()
    return false
  }
  const movedTo = (await items.first().textContent())?.trim() ?? '?'
  await items.first().click({ timeout: 5000 })
  await page.waitForTimeout(1200)

  // The toast, and whether it offers Undo at all.
  const toastText = await page.evaluate(() => {
    const hit = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && /\bmoved to\b/i.test(e.textContent || '')
    )
    return hit ? (hit.textContent || '').trim() : null
  })
  const hasUndo = await page.getByText('Undo', { exact: true }).count()

  await page.screenshot({ path: `${OUT}/move-undo--${mode}.png` })

  if (mode === 'undo') {
    await page.getByText('Undo', { exact: true }).first().click({ timeout: 5000 })
    // Wait well past the window: if cancelling failed, the write lands here.
    await page.waitForTimeout(UNDO_WINDOW_MS + 2500)
  } else {
    await page.waitForTimeout(UNDO_WINDOW_MS + 2500)
  }

  // Every write for the whole run, not a delta from some baseline.
  //
  // The first version of this counted only writes that arrived AFTER the toast
  // appeared. That hid a duplicate sent during the move itself — the undo case
  // reported a clean 0 while a write had already gone out before the baseline
  // was taken. A test that can only see part of the wire is not watching the
  // wire.
  // Requests only — the response lines above share the array for ordering.
  const sent = writes.filter((w) => !w.startsWith('      ↳')).length

  // What this asserts:
  //
  //   undo       EXACTLY zero writes — the claim #643 makes.
  //   let-it-go  EXACTLY one write, and it must succeed.
  //
  // "Exactly one" was "at least one" while #646 was open: the endpoint 404'd
  // and the client then sent a second request ~1s later, so pinning 1 would
  // have baked a bug into the expectation and pinning 2 would have blessed it.
  // #646 is fixed, the duplicate is gone with it, and the count is now pinned.
  //
  // The status is asserted, not just the count. A 404 is still a write on the
  // wire, and counting it as a successful move is how the board came to claim
  // moves the server was refusing.
  const statuses = writes.filter((w) => w.startsWith('      ↳'))
  const allOk = statuses.length > 0 && statuses.every((s) => /↳ 2\d\d /.test(s))

  const ok =
    toastText !== null && hasUndo > 0 && (mode === 'undo' ? sent === 0 : sent === 1 && allOk)

  console.log(
    `${ok ? '✓' : '✗'} ${mode.padEnd(9)} to="${movedTo}" toast=${toastText ? `"${toastText}"` : 'MISSING'} ` +
      `undo=${hasUndo > 0 ? 'offered' : 'MISSING'} writes=${sent} ` +
      `(expected ${mode === 'undo' ? 'exactly 0' : 'exactly 1, 2xx'})` +
      (ok
        ? ''
        : mode === 'undo'
          ? ' ← UNDO DID NOT STOP THE WRITE'
          : sent === 0
            ? ' ← THE HELD WRITE NEVER FIRED'
            : sent > 1
              ? ` ← ${sent} WRITES FOR ONE MOVE`
              : ' ← THE WRITE WAS REJECTED')
  )
  if (writes.length) console.log(`   wire:\n     ${writes.join('\n     ')}`)

  await ctx.close()
  return ok
}

for (const mode of ['undo', 'let-it-go']) {
  const ok = await run(mode)
  if (!ok) failures++
}

await browser.close()
console.log(failures ? `\n${failures} case(s) failed` : '\nall cases passed')
await finish(BASE, failures)
