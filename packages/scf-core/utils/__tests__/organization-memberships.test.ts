import { describe, expect, it } from 'vitest'
import {
  canHireFor,
  mergeOrganizationMemberships,
  primaryHiringOrganization,
} from '../organization-memberships'

const USER = 'user-1'
const alpha = { id: 'org-a', name: 'Alpha Org', slug: 'alpha' }
const beta = { id: 'org-b', name: 'Beta Org', slug: 'beta' }
const apex = { id: 'org-x', name: 'Apex Mechanical', slug: 'apex' }

const team = (org: typeof alpha | null, created_at: string) => ({
  user_id: USER,
  created_at,
  teams: { organizations: org },
})

describe('mergeOrganizationMemberships (#1312)', () => {
  it('keeps team memberships as members, one row per organisation, by name', () => {
    const result = mergeOrganizationMemberships(USER, {
      teams: [team(beta, '2024-01-01'), team(alpha, '2024-02-01'), team(alpha, '2024-03-01'), team(null, '2024-04-01')],
    })
    expect(result).toEqual([
      {
        organization_id: 'org-a',
        organization_name: 'Alpha Org',
        organization_slug: 'alpha',
        user_id: USER,
        role: 'member',
        joined_at: '2024-02-01',
      },
      {
        organization_id: 'org-b',
        organization_name: 'Beta Org',
        organization_slug: 'beta',
        user_id: USER,
        role: 'member',
        joined_at: '2024-01-01',
      },
    ])
  })

  // The seeded orgAdmin persona: owns Apex and holds its org `admin` role, and
  // is on no team. Before #1312 this person had no organisations at all.
  it('includes an organisation the person owns or administers without a team', () => {
    const result = mergeOrganizationMemberships(USER, {
      teams: [],
      owned: [{ ...apex, created_at: '2025-01-01' }],
      roles: [{ created_at: '2025-01-02', role: { name: 'admin' }, organization: apex }],
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ organization_id: 'org-x', role: 'owner', joined_at: '2025-01-01' })
  })

  it('names an org-scoped admin assignment admin, and anything else member', () => {
    const result = mergeOrganizationMemberships(USER, {
      roles: [
        { created_at: '2025-01-01', role: [{ name: 'admin' }], organization: [alpha] },
        { created_at: '2025-01-01', role: { name: 'member' }, organization: beta },
      ],
    })
    expect(result.map((m) => [m.organization_id, m.role])).toEqual([
      ['org-a', 'admin'],
      ['org-b', 'member'],
    ])
  })

  it('lets the strongest relationship win whichever order the sources arrive in', () => {
    const result = mergeOrganizationMemberships(USER, {
      teams: [team(alpha, '2023-06-01')],
      roles: [{ created_at: '2024-01-01', role: { name: 'admin' }, organization: alpha }],
    })
    expect(result).toEqual([
      expect.objectContaining({ organization_id: 'org-a', role: 'admin', joined_at: '2023-06-01' }),
    ])
  })

  it('tolerates missing sources', () => {
    expect(mergeOrganizationMemberships(USER, {})).toEqual([])
    expect(mergeOrganizationMemberships(USER, { teams: null, owned: null, roles: null })).toEqual([])
  })
})

describe('who may hire', () => {
  const memberships = mergeOrganizationMemberships(USER, {
    teams: [team(alpha, '2024-01-01')],
    roles: [{ created_at: '2024-01-01', role: { name: 'admin' }, organization: beta }],
  })

  it('is the owner or the org admin, as the api decides', () => {
    expect(memberships.map((m) => [m.organization_id, canHireFor(m)])).toEqual([
      ['org-a', false],
      ['org-b', true],
    ])
  })

  it('prefers an organisation the person can hire for', () => {
    expect(primaryHiringOrganization(memberships)?.organization_id).toBe('org-b')
    expect(primaryHiringOrganization([memberships[0]])?.organization_id).toBe('org-a')
    expect(primaryHiringOrganization(undefined)).toBeNull()
  })
})
