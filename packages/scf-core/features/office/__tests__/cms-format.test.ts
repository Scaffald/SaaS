import { describe, expect, it } from 'vitest'
import {
  badgeVariantForTone,
  employmentTypeLabel,
  formatCellDate,
  formatPayRange,
  projectStatus,
} from '../cms-format'
import { filterTeamRows, toTeamRow } from '../teams/team-rows'

describe('formatPayRange (#1204)', () => {
  it('writes an hourly range with one sign and an en dash', () => {
    expect(formatPayRange(5200, 5800, 'hourly')).toBe('$52–58/hr')
  })

  it('compacts a salary with separators the old cell lacked', () => {
    expect(formatPayRange(10_000_000, 15_000_000, 'salary')).toBe('$100k–150k/yr')
    expect(formatPayRange(9_550_000, 12_000_000, 'salary')).toBe('$95.5k–120k/yr')
  })

  it('keeps cents when an hourly rate has them', () => {
    expect(formatPayRange(5250, 5800, 'hourly')).toBe('$52.50–58/hr')
  })

  it('defaults a missing type to hourly and drops the unit for others', () => {
    expect(formatPayRange(4000, 5000, null)).toBe('$40–50/hr')
    expect(formatPayRange(500_000, 800_000, 'project')).toBe('$5k–8k')
  })

  it('says which end a half range has', () => {
    expect(formatPayRange(5200, null, 'hourly')).toBe('From $52/hr')
    expect(formatPayRange(null, 5800, 'hourly')).toBe('Up to $58/hr')
  })

  it('collapses an equal range and orders a reversed one', () => {
    expect(formatPayRange(5000, 5000, 'hourly')).toBe('$50/hr')
    expect(formatPayRange(5800, 5200, 'hourly')).toBe('$52–58/hr')
  })

  it('returns null with nothing to show', () => {
    expect(formatPayRange(null, undefined, 'hourly')).toBeNull()
    expect(formatPayRange(0, 0, 'hourly')).toBeNull()
  })
})

describe('employmentTypeLabel', () => {
  it('names the known types', () => {
    expect(employmentTypeLabel('full_time')).toBe('Full-time')
    expect(employmentTypeLabel('temp')).toBe('Temporary')
  })

  it('de-snakes an unknown type and nulls an empty one', () => {
    expect(employmentTypeLabel('per_diem')).toBe('Per diem')
    expect(employmentTypeLabel(null)).toBeNull()
  })
})

describe('status badges', () => {
  it('maps listing tones onto the shared badge', () => {
    expect(badgeVariantForTone('active')).toBe('success')
    expect(badgeVariantForTone('attention')).toBe('warning')
    expect(badgeVariantForTone('neutral')).toBe('default')
  })

  it('labels project statuses instead of printing them raw', () => {
    expect(projectStatus('on_hold')).toEqual({ label: 'On hold', variant: 'warning' })
    expect(projectStatus('active').variant).toBe('success')
    expect(projectStatus('weird_state').label).toBe('Weird state')
  })
})

describe('formatCellDate', () => {
  it('returns null for missing or broken dates', () => {
    expect(formatCellDate(null)).toBeNull()
    expect(formatCellDate('not a date')).toBeNull()
    expect(formatCellDate('2026-10-01T12:00:00Z')).toMatch(/2026/)
  })
})

describe('toTeamRow (#1206)', () => {
  const orgs = new Map([['org-1', 'Hoffman Structures']])

  it('reads the snake_case row the api actually returns', () => {
    const row = toTeamRow(
      {
        id: 't1',
        name: 'Default Team',
        organization_id: 'org-1',
        visibility: 'organization',
        default_role_key: 'hiring_manager',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      },
      orgs
    )
    expect(row.organizationName).toBe('Hoffman Structures')
    expect(row.updatedAt).toBe('2026-02-01T00:00:00Z')
    expect(row.defaultRole).toBe('Hiring manager')
  })

  it('falls back to created_at when updated_at is missing', () => {
    const row = toTeamRow({ id: 't2', name: 'Crew', createdAt: '2026-01-01T00:00:00Z' }, orgs)
    expect(row.updatedAt).toBe('2026-01-01T00:00:00Z')
    expect(row.organizationName).toBeNull()
    expect(row.visibility).toBe('organization')
  })

  it('prefers the camelCase role name when present', () => {
    const row = toTeamRow(
      { id: 't3', name: 'X', defaultRole: { name: 'Recruiter', key: 'recruiter' } },
      orgs
    )
    expect(row.defaultRole).toBe('Recruiter')
  })

  it('filters by organization and searches the organization name', () => {
    const rows = [
      toTeamRow({ id: 'a', name: 'Default Team', organization_id: 'org-1' }, orgs),
      toTeamRow({ id: 'b', name: 'Default Team', organization_id: 'org-2' }, orgs),
    ]
    expect(filterTeamRows(rows, '', 'org-1').map((r) => r.id)).toEqual(['a'])
    expect(filterTeamRows(rows, 'hoffman', null).map((r) => r.id)).toEqual(['a'])
    expect(filterTeamRows(rows, '', null)).toHaveLength(2)
  })
})
