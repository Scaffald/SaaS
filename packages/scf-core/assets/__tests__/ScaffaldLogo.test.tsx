import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ScaffaldLogo } from '../ScaffaldLogo'

/**
 * The hydration invariant: rendering the same tree twice must produce identical
 * markup. The server render and the client render are two such renders, so any
 * difference here is a guaranteed hydration mismatch in the browser.
 *
 * This used to fail — the gradient id came from Math.random(), so React
 * discarded the tree and re-rendered the whole page on every SSR route, because
 * the logo lives in the app shell (#582).
 */
describe('ScaffaldLogo', () => {
  it('renders identical markup across independent renders', () => {
    const first = renderToStaticMarkup(<ScaffaldLogo />)
    const second = renderToStaticMarkup(<ScaffaldLogo />)

    expect(first).toBe(second)
  })

  it('renders identical markup for the square variant too', () => {
    const first = renderToStaticMarkup(<ScaffaldLogo width={100} height={100} />)
    const second = renderToStaticMarkup(<ScaffaldLogo width={100} height={100} />)

    expect(first).toBe(second)
  })

  it('contains no random-looking gradient id', () => {
    const markup = renderToStaticMarkup(<ScaffaldLogo />)

    // The old id was `logo-gradient-` + 9 chars of Math.random().toString(36).
    expect(markup).not.toMatch(/logo-gradient-[a-z0-9]{9}["']/)
    expect(markup).toContain('logo-gradient-')
  })

  it('gives two logos in one tree distinct gradient ids', () => {
    // Distinctness still matters: two <defs> sharing an id would make one
    // gradient win for both.
    const markup = renderToStaticMarkup(
      <>
        <ScaffaldLogo />
        <ScaffaldLogo />
      </>
    )

    const ids = [...markup.matchAll(/id="(logo-gradient-[^"]+)"/g)].map((m) => m[1])

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('emits ids that are valid in an SVG url() reference', () => {
    // useId() returns ":r0:" style values; colons are not usable in url(#id).
    const markup = renderToStaticMarkup(<ScaffaldLogo />)
    const ids = [...markup.matchAll(/id="(logo-gradient-[^"]+)"/g)].map((m) => m[1])

    for (const id of ids) {
      expect(id).not.toContain(':')
    }
  })
})
