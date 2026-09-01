import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScaffaldLogo } from '../ScaffaldLogo'

/**
 * ScaffaldLogo's SVG gradient id has been wrong twice, in opposite directions.
 *
 * It was `Math.random()`, so the server id could never equal the client id;
 * React discarded the tree and re-rendered every SSR page, because the logo
 * lives in the app shell (#582). `useId()` fixed that — and then #625 showed
 * `useId` was still the wrong key: it encodes the component's POSITION in the
 * React tree, and server and client do not agree on that position for an
 * authenticated page. Hydration succeeded (the DOM matched) but React reported
 * the id attribute as mismatched and refused to patch it, on every SSR route.
 *
 * The id now names the GRADIENT — derived from its colours. That makes the
 * decisive invariant testable here for the first time: the old file noted it
 * could NOT assert byte-identity across two separate `render()` calls, because
 * two roots legitimately produce different `useId` values. Position is no
 * longer an input, so two roots must now agree, and 'is identical across two
 * independent roots' below is the closest this harness gets to the real
 * server-markup === client-markup claim.
 *
 * Sharing an id between two logos is CORRECT when their colours match: the
 * `<linearGradient>` they would each define is byte-identical, so one shared
 * def is the right output, not a collision. Distinctness is only required when
 * the gradients actually differ.
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

  it('is identical across two independent roots', () => {
    // The #625 invariant, and the one the previous implementation could not
    // satisfy. Two separate render() calls are two React roots — exactly the
    // situation the server render and the client render are in.
    const a = render(<ScaffaldLogo />)
    const b = render(<ScaffaldLogo />)

    expect(gradientIds(a.container.innerHTML)).toEqual(gradientIds(b.container.innerHTML))
  })

  it('does not depend on where in the tree the logo sits', () => {
    // Position was the input that server and client disagreed about.
    const flat = render(<ScaffaldLogo />)
    const nested = render(
      <div>
        <div>
          <span />
          <ScaffaldLogo />
        </div>
      </div>
    )

    expect(gradientIds(nested.container.innerHTML)).toEqual(gradientIds(flat.container.innerHTML))
  })

  it('lets two logos of the same colour share one gradient def', () => {
    // Not a collision: the two <linearGradient> elements would be identical,
    // so one shared def is the correct output.
    const { container } = render(
      <>
        <ScaffaldLogo />
        <ScaffaldLogo />
      </>
    )

    const ids = gradientIds(container.innerHTML)

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(1)
  })

  it('separates logos whose gradients actually differ', () => {
    // This is where distinctness genuinely matters — sharing an id here would
    // make one gradient win for both and paint the wrong colours.
    const { container } = render(
      <>
        <ScaffaldLogo gradientStart="#76EAFF" gradientEnd="#239CB2" />
        <ScaffaldLogo gradientStart="#FF0000" gradientEnd="#00FF00" />
      </>
    )

    const ids = gradientIds(container.innerHTML)

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('emits ids that are valid in an SVG url() reference', () => {
    // A colour arrives as `#76EAFF` or `rgb(1, 2, 3)`; neither `#`, `(` nor a
    // space is usable inside url(#id).
    const { container } = render(<ScaffaldLogo gradientStart="rgb(1, 2, 3)" />)
    const ids = gradientIds(container.innerHTML)

    expect(ids.length).toBeGreaterThan(0)
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z][A-Za-z0-9-]*$/)
    }
  })

  it('points the gradient fill at the id it defines', () => {
    // The whole point of the id: a mismatch here renders an unfilled logo.
    const { container } = render(<ScaffaldLogo />)
    const [id] = gradientIds(container.innerHTML)

    expect(container.innerHTML).toContain(`url(#${id})`)
  })
})
