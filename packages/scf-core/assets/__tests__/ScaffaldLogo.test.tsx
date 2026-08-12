import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScaffaldLogo } from '../ScaffaldLogo'

/**
 * ScaffaldLogo derived its SVG gradient id from Math.random(), so the
 * server-rendered id could never equal the client-rendered one. React discarded
 * the tree and re-rendered the whole page — on every SSR route, because the logo
 * lives in the app shell (#582). It is now useId().
 *
 * The exact invariant (server markup === client markup) is not expressible in
 * this harness: `react-dom/server` is not in the workspace's vitest alias list,
 * and importing it resolves into Flow-typed React Native source, killing the
 * file at collection. What is asserted instead are the properties that fail if
 * the id is random again:
 *
 *   - the id is not drawn from a random source
 *   - it is stable across re-renders of the same tree
 *   - two logos in one tree still differ
 *
 * Note that byte-identity across two *separate* render() calls is deliberately
 * NOT asserted — those are two React roots, and useId is only required to be
 * deterministic by position within a root. Asserting it would encode a false
 * expectation that a correct implementation fails.
 */
describe('ScaffaldLogo', () => {
  const gradientIds = (html: string) =>
    [...html.matchAll(/id="(logo-gradient-[^"]+)"/g)].map((m) => m[1])

  it('does not draw the gradient id from a random source', () => {
    const { container } = render(<ScaffaldLogo />)

    // The old id was `logo-gradient-` + 9 chars of Math.random().toString(36).
    expect(container.innerHTML).not.toMatch(/logo-gradient-[a-z0-9]{9}["']/)
    expect(container.innerHTML).toContain('logo-gradient-')
  })

  it('keeps the same id across re-renders of the same tree', () => {
    const { container, rerender } = render(<ScaffaldLogo />)
    const before = gradientIds(container.innerHTML)

    rerender(<ScaffaldLogo />)
    const after = gradientIds(container.innerHTML)

    expect(after).toEqual(before)
    expect(before.length).toBeGreaterThan(0)
  })

  it('keeps the same id when unrelated props change', () => {
    const { container, rerender } = render(<ScaffaldLogo width={609} height={99} />)
    const before = gradientIds(container.innerHTML)

    rerender(<ScaffaldLogo width={300} height={49} />)

    expect(gradientIds(container.innerHTML)).toEqual(before)
  })

  it('gives two logos in one tree distinct gradient ids', () => {
    // Distinctness still matters: two <defs> sharing an id would make one
    // gradient win for both.
    const { container } = render(
      <>
        <ScaffaldLogo />
        <ScaffaldLogo />
      </>
    )

    const ids = gradientIds(container.innerHTML)

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('emits ids that are valid in an SVG url() reference', () => {
    // useId() returns ":r0:" style values; colons are not usable in url(#id).
    const { container } = render(<ScaffaldLogo />)
    const ids = gradientIds(container.innerHTML)

    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(id).not.toContain(':')
    }
  })

  it('points the gradient fill at the id it defines', () => {
    // The whole point of the id: a mismatch here renders an unfilled logo.
    const { container } = render(<ScaffaldLogo />)
    const [id] = gradientIds(container.innerHTML)

    expect(container.innerHTML).toContain(`url(#${id})`)
  })
})
