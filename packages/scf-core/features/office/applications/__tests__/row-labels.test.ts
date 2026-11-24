import { describe, expect, it } from 'vitest'
import { assigneeLabel, formatScore, matchesPipelineSearch, stageActorLabel } from '../row-labels'

describe('formatScore (#1198)', () => {
  it('returns null for an unscored candidate rather than 0', () => {
    expect(formatScore(null)).toBeNull()
    expect(formatScore(undefined)).toBeNull()
  })

  it('keeps a real zero, which is a score', () => {
    expect(formatScore(0)).toBe('0')
  })

  it('rounds a fractional score', () => {
    expect(formatScore(87.6)).toBe('88')
  })
})

describe('assigneeLabel (#1198)', () => {
  it('says Unassigned when nobody is', () => {
    expect(assigneeLabel(null, 'me')).toBe('Unassigned')
  })

  it('says You when the viewer is the assignee', () => {
    expect(assigneeLabel({ id: 'me', name: 'Zach' }, 'me')).toBe('You')
  })

  it('names someone else', () => {
    expect(assigneeLabel({ id: 'u-2', name: 'Dana Ortiz' }, 'me')).toBe('Dana Ortiz')
  })

  it('still says Assigned when the name did not come back', () => {
    expect(assigneeLabel({ id: 'u-2', name: null }, 'me')).toBe('Assigned')
  })
})

describe('matchesPipelineSearch', () => {
  const app = { candidate: { name: 'Alice Chen' }, job: { title: 'Site Electrical Lead' } }

  it('matches the name or the job, ignoring case', () => {
    expect(matchesPipelineSearch(app, 'alice')).toBe(true)
    expect(matchesPipelineSearch(app, 'ELECTRICAL')).toBe(true)
    expect(matchesPipelineSearch(app, 'plumber')).toBe(false)
  })

  it('matches everything on an empty term', () => {
    expect(matchesPipelineSearch(app, '  ')).toBe(true)
  })
})

describe('stageActorLabel (#1414)', () => {
  const uuid = 'cc7a6805-1111-4222-8333-944455556666'

  it('names the mover', () => {
    expect(stageActorLabel({ changedBy: uuid, changedByName: 'Boris K' }, 'someone-else')).toBe(
      'Boris K'
    )
  })

  it('says You for the viewer’s own move', () => {
    expect(stageActorLabel({ changedBy: uuid, changedByName: 'Boris K' }, uuid)).toBe('You')
  })

  it('never prints the raw actor id', () => {
    expect(stageActorLabel({ changedBy: uuid, changedByName: null }, 'someone-else')).toBe(
      'A teammate'
    )
    expect(stageActorLabel({ changedBy: uuid, changedByName: '  ' })).toBe('A teammate')
    expect(stageActorLabel({ changedBy: '', changedByName: undefined }, '')).toBe('A teammate')
  })
})
