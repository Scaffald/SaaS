/**
 * What every authed capture script needs between "the page loaded" and "the
 * screenshot is worth looking at". Shared so smoke-authed.mjs and
 * sweep-routes.mjs cannot drift apart again — #998 fixed the ready-wait in one
 * of them and left the other on a fixed timeout.
 */

/**
 * localStorage key and value that dismiss the cookie banner. The banner is a
 * real screen element but not one under review, and at 390px it covers the
 * bottom fifth of every capture — exactly where phone overflow shows up.
 */
export const COOKIE_CONSENT_KEY = 'scf-cookie-consent'
export const cookieConsentValue = () =>
  JSON.stringify({
    version: '1',
    updatedAt: new Date().toISOString(),
    selections: { essential: true, analytics: false, marketing: false },
  })

/**
 * networkidle is not "rendered". The theme resolves from storage and
 * InnerProvider stamps <html data-theme>, and the protected layout holds a
 * "Loading..." overlay until the session and prerequisites settle. On a cold
 * Metro bundle both outlast any fixed wait (#967). Resolves true when ready,
 * false on timeout — the caller decides whether a late capture is still useful.
 */
export async function waitForAppReady(page, { timeout = 45000, settle = 1500 } = {}) {
  const ready = await page
    .waitForFunction(
      () =>
        document.documentElement.getAttribute('data-theme') !== null &&
        !/\bLoading\.\.\./.test(document.body.innerText),
      { timeout },
    )
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(settle)
  return ready
}

/**
 * Facts about the rendered frame that a screenshot alone does not give you.
 *
 * `hScroll` (document wider than the viewport) misses the common phone failure:
 * content cut off by an `overflow: hidden` ancestor never widens the document.
 * `clipped` counts visible elements whose right edge passes the viewport and
 * that are not inside a horizontal scroller (a tab strip or a board that is
 * meant to scroll sideways is not a glitch).
 *
 * `bodyBg` is the computed page ground. A stamped data-theme is not a themed
 * tree, so a dark capture whose ground is light is reported, not trusted.
 */
export async function frameFacts(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const vw = doc.clientWidth
    const inScroller = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true
      }
      return false
    }
    const clipped = []
    for (const el of document.querySelectorAll('#root *')) {
      if (el.children.length > 0 && !el.textContent?.trim()) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue
      if (r.right <= vw + 1 || r.left >= vw) continue
      if (getComputedStyle(el).visibility === 'hidden' || inScroller(el)) continue
      // Report the innermost offender only; its ancestors are the same finding.
      if (clipped.some((c) => el.contains(c.el))) continue
      for (let i = clipped.length - 1; i >= 0; i--) if (clipped[i].el.contains(el)) clipped.splice(i, 1)
      clipped.push({ el, text: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40), right: Math.round(r.right) })
    }
    const heading = document.querySelector('h1, [aria-level="1"], h2, [aria-level="2"], [role="heading"]')
    const rect = heading ? heading.getBoundingClientRect() : null
    return {
      landed: location.pathname,
      renderedTheme: doc.getAttribute('data-theme') ?? 'unset',
      bodyBg: getComputedStyle(document.body).backgroundColor,
      hScroll: doc.scrollWidth > vw + 1,
      scrollWidth: doc.scrollWidth,
      clipped: clipped.slice(0, 5).map(({ text, right }) => ({ text, right })),
      textLen: document.body.innerText.length,
      title: heading ? heading.textContent.trim().slice(0, 60) : null,
      titleX: rect ? Math.round(rect.x) : null,
      titleY: rect ? Math.round(rect.y) : null,
    }
  })
}

/** Relative luminance of an `rgb()`/`rgba()` string, 0 (black) to 1 (white). */
export function luminance(rgb) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(rgb ?? '')
  if (!m) return null
  if (m[4] !== undefined && Number(m[4]) === 0) return null // transparent: no ground to judge
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const c = Number(v) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * `--scheme light|dark|both` (or `--scheme=…`), defaulting to light. Exits 2
 * on anything else.
 */
export function parseSchemes(argv = process.argv, fallback = 'light') {
  const arg =
    (argv.find((a) => a.startsWith('--scheme=')) ?? '').split('=')[1] ||
    (argv.includes('--scheme') ? argv[argv.indexOf('--scheme') + 1] : null) ||
    fallback
  if (!['light', 'dark', 'both'].includes(arg)) {
    console.error(`Unknown --scheme ${arg}. Use light, dark or both.`)
    process.exit(2)
  }
  return arg === 'both' ? ['light', 'dark'] : [arg]
}
