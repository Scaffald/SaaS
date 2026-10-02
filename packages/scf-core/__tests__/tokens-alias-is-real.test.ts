import { describe, expect, it } from 'vitest'
import { borderRadius, colors, fontScale, fontSize } from '@scaffald/ui/tokens'

/**
 * `@scaffald/ui/tokens` must resolve to the real tokens under test, never to a
 * stub.
 *
 * It used to be aliased to `tests/infrastructure/vitest/mocks/beyond-ui-tokens.ts`,
 * a hand-maintained copy that had drifted from production in both directions
 * (#944):
 *
 *   * Its `borderRadius` was still the PRE-#621 scale — xs 6, s 8, l 12, xl 16
 *     — where the real interface scale has been 2 / 4 / 7 since the tokens
 *     landed. Nothing asserted on those numbers, which is the only reason it
 *     went unnoticed for months; any test that started asserting a radius would
 *     have asserted the wrong one and looked correct.
 *   * It carried a `slate` ramp that the real tokens do not have, and lacked
 *     `zinc`, which they do. So `colors.slate[500]` passed every test and was
 *     `undefined` in the app — a stub more permissive than reality, which is
 *     the dangerous direction.
 *
 * The failure mode for the missing direction is nasty: a real token absent from
 * the stub reads as `undefined`, and used at module scope it kills the whole
 * suite on import with a stack pointing at the *feature file*. The first guess
 * is always that the feature code is wrong.
 *
 * There was never a technical reason for the stub. `packages/ui/src/tokens` is
 * plain data modules with no react-native, expo, Platform or Dimensions import
 * between them, so they load in jsdom as-is.
 *
 * This test is the guard. If someone re-aliases the tokens to a stub, the
 * assertions below are what tells them.
 */
describe('@scaffald/ui/tokens resolves the real tokens', () => {
  it('carries ramps that no stub was ever hand-updated with', () => {
    // zinc is the cool-grey ramp the app actually has. The old stub had none.
    expect(colors.zinc[500]).toBe('#71717a')
    expect(colors.amber[500]).toBe('#f59e0b')
  })

  it('does not invent ramps the app lacks', () => {
    // `slate` existed only in the stub. Code reaching for it would crash in
    // production while passing here.
    expect((colors as Record<string, unknown>).slate).toBeUndefined()
  })

  it('reports the post-#621 interface radius scale', () => {
    // The stub said l: 12, xl: 16. The prototype keeps corners nearly square.
    expect(borderRadius.xxs).toBe(2)
    expect(borderRadius.xs).toBe(4)
    expect(borderRadius.l).toBe(7)
    expect(borderRadius.max).toBe(999)
  })

  it('reports the six-step type scale', () => {
    expect([
      fontScale.step1,
      fontScale.step2,
      fontScale.step3,
      fontScale.step4,
      fontScale.step5,
      fontScale.step6,
    ]).toEqual([11, 12.5, 14, 17, 22, 30])
    expect(fontScale.display).toBe(42)
    // 12.5 is a step of the scale, not a stray half-pixel between two.
    expect(fontSize.sm).toBe(12.5)
  })

  it('carries the theme dimension, so inverse text can flip with its fill', () => {
    // text[theme].quaternary is what a literal '#fff' on a themed fill should
    // become — it is white in light and near-black in dark (#820).
    expect(colors.text.light.quaternary).toBe('#ffffff')
    expect(colors.text.dark.quaternary).not.toBe('#ffffff')
  })
})
