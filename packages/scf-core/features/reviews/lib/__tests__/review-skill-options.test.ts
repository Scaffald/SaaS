import { describe, expect, it } from 'vitest'
import { ratableSkillsFromSubject, softSkillsInCategory } from '../review-skill-options'

describe('ratableSkillsFromSubject (#1247)', () => {
  it("rates the subject's own named skills, keyed by their user_skills row", () => {
    expect(
      ratableSkillsFromSubject([
        { id: 'us-1', skill_details: { name: 'Concrete Forming' } },
        { id: 'us-2', skill_details: { name: '  Rebar Placement ' } },
      ])
    ).toEqual([
      { id: 'us-1', name: 'Concrete Forming' },
      { id: 'us-2', name: 'Rebar Placement' },
    ])
  })

  it('leaves out rows with no name and repeated rows', () => {
    expect(
      ratableSkillsFromSubject([
        { id: 'us-1', skill_details: null },
        { id: 'us-2', skill_details: { name: '' } },
        { id: 'us-3', skill_details: { name: 'Framing' } },
        { id: 'us-3', skill_details: { name: 'Framing' } },
      ])
    ).toEqual([{ id: 'us-3', name: 'Framing' }])
  })

  it('is empty, not invented, when the subject lists no skills', () => {
    expect(ratableSkillsFromSubject(undefined)).toEqual([])
    expect(ratableSkillsFromSubject([])).toEqual([])
  })
})

describe('softSkillsInCategory (#1247)', () => {
  const catalog = {
    reliability: [
      { id: 'r2', name: 'Prioritization', category: 'reliability', order_index: 2 },
      { id: 'r1', name: 'Deadline Management', category: 'reliability', order_index: 1 },
    ],
    collaboration: [{ id: 'c1', name: 'Communication', category: 'collaboration', order_index: 1 }],
  }

  it('returns one category in catalog order', () => {
    expect(softSkillsInCategory(catalog, 'reliability')).toEqual([
      { id: 'r1', name: 'Deadline Management', category: 'reliability' },
      { id: 'r2', name: 'Prioritization', category: 'reliability' },
    ])
  })

  it('is empty for a missing category or catalog', () => {
    expect(softSkillsInCategory(catalog, 'technical')).toEqual([])
    expect(softSkillsInCategory(undefined, 'reliability')).toEqual([])
  })
})
