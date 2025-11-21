import { describe, expect, it, beforeEach, vi } from 'vitest'

const { mockUseQuery } = vi.hoisted(() => ({ mockUseQuery: vi.fn() }))

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    schema: vi.fn(() => ({ rpc: vi.fn(), from: vi.fn() })),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (config: unknown) => mockUseQuery(config),
}))

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: supabaseMock,
}))

const createJobQueryBuilder = (data: unknown[] | null, error: { message: string } | null = null) => {
  const builder: any = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
  builder.returns = vi.fn().mockResolvedValue({ data, error })
  return builder
}

const createOrgRpcBuilder = (data: unknown[] | null, error: { message: string } | null = null) => ({
  returns: vi.fn().mockResolvedValue({ data, error }),
})

const createTalentQueryBuilder = (data: unknown[] | null, error: { message: string } | null = null) => {
  const builder: any = {}
  builder.select = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.gte = vi.fn(() => builder)
  builder.lte = vi.fn(() => builder)
  builder.limit = vi.fn(() => builder)
   builder.in = vi.fn(() => builder)
  builder.then = (resolve: (value: { data: unknown[] | null; error: { message: string } | null }) => void) =>
    Promise.resolve({ data, error }).then(resolve)
  builder.catch = (reject: (reason: unknown) => void) =>
    Promise.resolve({ data, error }).catch(reject)
  return builder
}

import { useJobs } from '../useJobs'
import { useOrganizations } from '../useOrganizations'
import { useTalentProfiles } from '../useTalentProfiles'

describe('discovery data hooks', () => {
  beforeEach(() => {
    mockUseQuery.mockImplementation((config) => config)
    supabaseMock.schema.mockReset()
  })

  it('fetches jobs and filters by viewport bounds', async () => {
    const jobs = [
      {
        id: 'job-1',
        title: 'Electrician',
        organization_id: 'org-1',
        employment_type: 'full-time',
        remote_option: null,
        location: 'Charlotte, NC',
        address: { latitude: 35.22, longitude: -80.84 },
        longitude: -80.84,
        latitude: 35.22,
        pay_range_min_cents: 3000,
        pay_range_max_cents: 5000,
        pay_range_type: 'hourly',
        status: 'open',
        position_level: 'mid',
        organization_name: 'Acme Co',
      },
      {
        id: 'job-2',
        title: 'Painter',
        organization_id: 'org-2',
        employment_type: null,
        remote_option: null,
        location: 'Raleigh, NC',
        address: { latitude: 36.0, longitude: -77.0 },
        longitude: -77,
        latitude: 36,
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
        status: 'open',
        position_level: null,
        organization_name: 'NC Painters',
      },
    ]

    const rpcMock = vi.fn().mockResolvedValue({ data: jobs, error: null })
    supabaseMock.schema.mockReturnValue({ rpc: rpcMock })

    const bounds = { north: 35.5, south: 35.0, east: -80.5, west: -81.0 }

    const config = useJobs({ bounds, limit: 999 }) as any
    const result = await config.queryFn()

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['map-jobs', bounds] }))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('job-1')
    expect(result[0].coordinates).toEqual([-80.84, 35.22])
    expect(result[0].organization_name).toBe('Acme Co')
  })

  it('throws when job fetch encounters an error', async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    supabaseMock.schema.mockReturnValue({ rpc: rpcMock })

    const config = useJobs() as any
    await expect(config.queryFn()).rejects.toThrow('Failed to fetch jobs: boom')
  })

  it('fetches organizations and limits the number returned', async () => {
    const organizations = [
      {
        id: 'org-1',
        name: 'Acme Builders',
        longitude: -80,
        latitude: 35,
        address: { city: 'Charlotte', state: 'NC' },
        employee_count_range: '10-20',
        industry_name: 'Construction',
      },
      {
        id: 'org-2',
        name: 'Remote Org',
        longitude: -100,
        latitude: 10,
        address: null,
        employee_count_range: null,
        industry_name: null,
      },
    ]

    const rpcBuilder = createOrgRpcBuilder(organizations)
    const schemaReturn = {
      rpc: vi.fn(() => rpcBuilder),
    }
    supabaseMock.schema.mockReturnValue(schemaReturn)

    const bounds = { north: 36, south: 34, east: -79, west: -81 }
    const config = useOrganizations({ bounds, limit: 50 }) as any
    const result = await config.queryFn()

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['map-organizations', bounds] }))
    expect(schemaReturn.rpc).toHaveBeenCalledWith('get_organizations_with_coords')
    expect(result).toEqual([
      expect.objectContaining({ id: 'org-1', coordinates: [-80, 35], industry: 'Construction' }),
    ])
  })

  it('maps talent profiles and applies bounds filters', async () => {
    const profiles = [
      {
        id: 'worker-1',
        name: 'Taylor Swift',
        headline: 'Electrician',
        gamified_score: 85,
        skills_summary: { skills: ['Electrical Wiring', 'Safety'] },
        certifications: ['OSHA 10'],
        hourly_rate_cents: 4500,
        longitude: -80,
        latitude: 35,
        location: 'Charlotte, NC',
        calculatedYearsOfExperience: 5,
        years_of_experience: 3,
        avatar_url: 'https://example.com/avatar.png',
      },
    ]

    const talentBuilder = createTalentQueryBuilder(profiles)
    const schemaReturn = {
      from: vi.fn(() => talentBuilder),
    }
    supabaseMock.schema.mockReturnValue(schemaReturn)

    const bounds = { north: 36, south: 34, east: -79, west: -81 }
    const config = useTalentProfiles({ bounds, limit: 800 }) as any
    const result = await config.queryFn()

    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['talent-profiles', bounds] }))
    expect(talentBuilder.gte).toHaveBeenCalledWith('longitude', bounds.west)
    expect(talentBuilder.lte).toHaveBeenCalledWith('latitude', bounds.north)
    expect(talentBuilder.limit).toHaveBeenCalledWith(500)
    expect(result).toEqual([
      expect.objectContaining({
        id: 'worker-1',
        badges: [expect.objectContaining({ label: 'Electrical Wiring' }), expect.objectContaining({ label: 'Safety' }), expect.objectContaining({ label: 'OSHA 10' })],
        hourlyRate: 45,
        coordinates: [-80, 35],
        scoreLabel: 'Best match',
      }),
    ])
  })

  it('throws when organization fetch fails', async () => {
    const rpcBuilder = createOrgRpcBuilder(null, { message: 'database down' })
    supabaseMock.schema.mockReturnValue({
      rpc: vi.fn(() => rpcBuilder),
    })

    const config = useOrganizations() as any
    await expect(config.queryFn()).rejects.toThrow('Failed to fetch organizations: database down')
  })

  it('returns empty array when organization query yields no results', async () => {
    const rpcBuilder = createOrgRpcBuilder([], null)
    supabaseMock.schema.mockReturnValue({
      rpc: vi.fn(() => rpcBuilder),
    })

    const config = useOrganizations() as any
    const result = await config.queryFn()

    expect(result).toEqual([])
  })

  it('normalizes profile data when optional fields are missing', async () => {
    const profiles = [
      {
        id: 'worker-2',
        name: null,
        headline: null,
        gamified_score: 55,
        skills_summary: null,
        certifications: null,
        hourly_rate_cents: null,
        longitude: null,
        latitude: null,
        location: null,
        calculatedYearsOfExperience: null,
        years_of_experience: null,
        avatar_url: null,
      },
    ]

    const talentBuilder = createTalentQueryBuilder(profiles)
    supabaseMock.schema.mockReturnValue({
      from: vi.fn(() => talentBuilder),
    })

    const config = useTalentProfiles() as any
    const result = await config.queryFn()

    expect(result).toEqual([
      expect.objectContaining({
        id: 'worker-2',
        name: 'Anonymous Worker',
        title: 'Skilled Trades Professional',
        hourlyRate: 0,
        coordinates: [-84.5555, 42.7325],
        scoreLabel: undefined,
        score: 55,
        badges: [],
        certifications: [],
        skills: [],
        experienceYears: 0,
        locationLabel: 'Location not set',
      }),
    ])
  })
})

