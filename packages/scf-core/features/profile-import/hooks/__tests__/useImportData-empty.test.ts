import { describe, expect, it } from 'vitest'

/**
 * `isEmpty` is the whole point of this file: `GET /v1/profiles/import/data`
 * returns a bare `null` for a user who has never uploaded a resume, and the
 * review screen used to render that as a red "We couldn't load your import
 * data" with a Retry button that could only ever produce the same null (#589).
 *
 * The rule is small enough to state directly, and stating it directly is what
 * keeps the three states distinguishable.
 */
function deriveIsEmpty(args: {
  isLoading: boolean
  isError: boolean
  importData: unknown | null
}): boolean {
  return !args.isLoading && !args.isError && args.importData === null
}

describe('import review states', () => {
  it('is empty when the query succeeded and there is no payload', () => {
    expect(deriveIsEmpty({ isLoading: false, isError: false, importData: null })).toBe(true)
  })

  it('is not empty while the query is still in flight', () => {
    // Otherwise a slow first load flashes "nothing to review" before the data
    // arrives, which reads as "your import was lost".
    expect(deriveIsEmpty({ isLoading: true, isError: false, importData: null })).toBe(false)
  })

  it('is not empty when the query failed', () => {
    // A failure must keep the Retry affordance — retrying a real failure can
    // succeed, whereas retrying an empty result never will.
    expect(deriveIsEmpty({ isLoading: false, isError: true, importData: null })).toBe(false)
  })

  it('is not empty when there is data', () => {
    expect(
      deriveIsEmpty({ isLoading: false, isError: false, importData: { experience: [] } })
    ).toBe(false)
  })
})
