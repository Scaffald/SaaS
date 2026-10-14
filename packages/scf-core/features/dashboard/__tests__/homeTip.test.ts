import { describe, expect, it } from 'vitest'
import { HOME_TIP_PLACEHOLDER, homeTip } from '../homeTip'

const incomplete = { totalComplete: 1, totalItems: 6 }
const complete = { totalComplete: 6, totalItems: 6 }

describe('homeTip (#1083)', () => {
  it('holds the line without a completion claim while completion loads', () => {
    expect(homeTip({ searches: 0, completion: null, completionPending: true })).toBe(
      HOME_TIP_PLACEHOLDER
    )
    expect(homeTip({ searches: 3, completion: null, completionPending: true })).toBe(
      HOME_TIP_PLACEHOLDER
    )
  })

  it('asks an incomplete profile to finish', () => {
    expect(homeTip({ searches: 0, completion: incomplete, completionPending: false })).toMatch(
      /^Finish your profile/
    )
    expect(homeTip({ searches: 2, completion: incomplete, completionPending: false })).toBe(
      'Employers found you 2 times in search this month. Finishing your profile puts you in front of more of them.'
    )
  })

  it('says complete only for a profile that is', () => {
    expect(homeTip({ searches: 0, completion: complete, completionPending: false })).toMatch(
      /^Your profile is complete/
    )
    expect(homeTip({ searches: 1, completion: complete, completionPending: false })).toBe(
      'Employers found you 1 time in search this month.'
    )
  })

  it('claims neither when completion failed to load', () => {
    expect(homeTip({ searches: 0, completion: null, completionPending: false })).toBeUndefined()
    expect(homeTip({ searches: 4, completion: null, completionPending: false })).toBe(
      'Employers found you 4 times in search this month.'
    )
  })
})
