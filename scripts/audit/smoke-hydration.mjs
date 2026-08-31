/**
 * Does an authenticated page hydrate cleanly?
 *
 * SSR only pays off if the client can reuse the server's HTML. When it cannot,
 * React discards the whole tree and re-renders — the entire cost of SSR paid
 * and then thrown away (#625).
 *
 * The check is a comparison, not a single reading: a PUBLIC page with no
 * session is the control. If that fails too, the cause is not auth-gated and
 * the diagnosis has to start somewhere else entirely.
 *
 * Two mistakes this script has already caught, both mine:
 *
 *   - a loose /hydrat/i filter matched react-native-web's startup log line
 *     `{rootTag: #root, hydrate: true}`, which is not an error. It made a
 *     clean logged-out load look like a failure and very nearly produced the
 *     opposite verdict. The filter is now React's actual message.
 *   - truncating the error to 200 chars hid the component stack, which is the
 *     only part that says WHERE. The stack is what showed the mismatch was in
 *     DrawerContent's width, not in the logo #625 blames.
 *
 * Usage (needs `web-redesign` on 8087 and the local Supabase stack):
 *
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... \
 *   node scripts/audit/smoke-hydration.mjs
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const URL = 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:8087'

// React's actual message. A loose /hydrat/i also matches react-native-web's
// startup log line `{rootTag: #root, hydrate: true}`, which is not an error —
// it made a clean logged-out load look like a failure and nearly produced the
// opposite verdict.
const HYDRATION_FAILURE =
  /Hydration failed|did not match|server rendered HTML didn't match|Text content does not match/i

const browser = await chromium.launch()

async function load(label, { withSession }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  if (withSession) {
    const sb = createClient(URL, ANON)
    const { data } = await sb.auth.signInWithPassword({
      email: process.env.SMOKE_EMAIL ?? 'zach@unicorn.love',
      password: process.env.SMOKE_PASSWORD ?? 'password123',
    })
    await ctx.addInitScript(
      ([k, s]) => localStorage.setItem(k, s),
      ['sb-127-auth-token', JSON.stringify(data.session)]
    )
  }

  const page = await ctx.newPage()
  const hydrationErrors = []
  page.on('console', (m) => {
    const t = m.text()
    if (HYDRATION_FAILURE.test(t)) hydrationErrors.push(t)
  })
  page.on('pageerror', (e) => {
    const t = String(e)
    if (HYDRATION_FAILURE.test(t)) hydrationErrors.push(t)
  })

  // A public route and an authenticated one.
  const path = withSession ? '/dashboard' : '/'
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(5000)

  console.log(
    `${hydrationErrors.length === 0 ? '✓' : '✗'} ${label.padEnd(22)} path=${path.padEnd(11)} hydrationErrors=${hydrationErrors.length}`
  )
  if (hydrationErrors[0]) console.log('--- full error ---\n' + hydrationErrors[0].slice(0, 2000))
  await ctx.close()
  return hydrationErrors.length
}

// The control: no session anywhere, a public route.
const loggedOut = await load('logged OUT, public', { withSession: false })
// The case the issue describes.
const loggedIn = await load('logged IN, dashboard', { withSession: true })

console.log('')
if (loggedOut > 0) {
  console.log('VERDICT: hydration fails WITHOUT a session — #625 blames the wrong thing.')
} else if (loggedIn > 0) {
  console.log('VERDICT: clean logged out, fails logged in — #625 mechanism holds.')
} else {
  console.log('VERDICT: no hydration errors in either case.')
}
await browser.close()

process.exit(loggedOut > 0 || loggedIn > 0 ? 1 : 0)
