import { describe, expect, it } from 'vitest'
import {
  completedScores,
  countRated,
  draftFromSaved,
  emptyRiasecDraft,
  ratedPercent,
} from './riasec-draft'

describe('RIASEC draft (#1173)', () => {
  it('starts with nothing rated', () => {
    const draft = emptyRiasecDraft()
    expect(countRated(draft)).toBe(0)
    expect(ratedPercent(draft)).toBe(0)
    expect(completedScores(draft)).toBeNull()
  })

  it('counts only the dimensions the user set', () => {
    const draft = { ...emptyRiasecDraft(), realistic: 3, social: 1 }
    expect(countRated(draft)).toBe(2)
    expect(ratedPercent(draft)).toBe(33)
    expect(completedScores(draft)).toBeNull()
  })

  it('is complete only when all six are set', () => {
    const draft = {
      realistic: 4,
      investigative: 5,
      artistic: 2,
      social: 3,
      enterprising: 1,
      conventional: 3,
    }
    expect(countRated(draft)).toBe(6)
    expect(ratedPercent(draft)).toBe(100)
    expect(completedScores(draft)).toEqual(draft)
  })

  it('restores saved scores and leaves bad values unset', () => {
    expect(draftFromSaved(null)).toEqual(emptyRiasecDraft())
    const draft = draftFromSaved({ realistic: 4, investigative: 9, artistic: '3' })
    expect(draft.realistic).toBe(4)
    expect(draft.investigative).toBeNull()
    expect(draft.artistic).toBeNull()
    expect(countRated(draft)).toBe(1)
  })
})
