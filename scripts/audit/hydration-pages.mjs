/**
 * Do the public pages hydrate cleanly, for every kind of device?
 *
 * Loads each page three times per device class against a running server and
 * counts hydration failures — React's dev message AND the minified production
 * codes (#418 HTML mismatch, #423/#425 text), because a production build says
 * only `Minified React error #418` and a word-based filter reads that as clean
 * (#786). Run it against a production export (`expo serve`) as well as the dev
 * server: the two resolve modules differently, and #786 only existed in the
 * export.
 *
 * Devices carry a user agent because the server picks its layout from it
 * (#782): a phone viewport with a desktop UA is not a phone.
 *
 * Usage:
 *   node scripts/audit/hydration-pages.mjs [baseUrl] [path ...]
 *   node scripts/audit/hydration-pages.mjs http://localhost:8093 /jobs /users/eric
 *
 * Exit code is the number of (page, device) pairs with a failure.
 */
import { chromium } from 'playwright'

const [, , baseArg, ...pathArgs] = process.argv
const base = baseArg || 'http://localhost:8081'
const pages = pathArgs.length
  ? pathArgs
  : ['/', '/jobs', '/jobs/senior-software-engineer-unicorn', '/users/eric', '/terms']
const LOADS = 3

const HYDRATION_FAILURE =
  /Hydration failed|did not match|server rendered HTML didn't match|Text content does not match|Minified React error #4(18|23|25)\b/i

const devices = {
  'phone 390': {
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1',
  },
  'tablet 800': {
    viewport: { width: 800, height: 1100 },
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Safari/604.1',
  },
  'desktop 1440': { viewport: { width: 1440, height: 900 } },
}

const browser = await chromium.launch()
let failingPairs = 0
for (const [label, opts] of Object.entries(devices)) {
  const context = await browser.newContext(opts)
  console.log(label)
  for (const path of pages) {
    let failures = 0
    let first = null
    for (let i = 0; i < LOADS; i++) {
      const page = await context.newPage()
      const note = (t) => {
        if (HYDRATION_FAILURE.test(t)) {
          failures++
          first ??= t
        }
      }
      page.on('pageerror', (e) => note(e.message))
      page.on('console', (m) => note(m.text()))
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 120000 })
      await page.waitForTimeout(1500)
      await page.close()
    }
    if (failures) failingPairs++
    console.log(
      `   ${failures === 0 ? '✓' : '✗'} ${path.padEnd(42)} ${failures === 0 ? 'clean' : `${failures} hydration failure(s) in ${LOADS} loads`}`
    )
    if (first) console.log(`      ${first.split('\n').slice(0, 1).join('').slice(0, 140)}`)
  }
  await context.close()
}
await browser.close()
process.exit(failingPairs)
