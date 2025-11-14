import { beforeEach, describe, expect, it, vi } from 'vitest'

const extractPlainText = vi.fn()

vi.mock('@app/ui', () => ({
  extractPlainText,
}))

const { filterEmployers } = await import('../employerFilters')

const createEmployer = (overrides: Partial<import('../../components/EmployerCard').Employer>) => ({
  id: 'emp-1',
  name: 'Summit Electrical',
  slug: 'summit-electrical',
  description: null,
  website_url: null,
  employee_count_range: null,
  annual_revenue_range: null,
  address: null,
  industries: null,
  created_at: new Date().toISOString(),
  ...overrides,
})

describe('employerFilters Integration - OR Logic', () => {
  beforeEach(() => {
    extractPlainText.mockReset()
  })

  it('filters employers with OR logic for multiple industry selections', () => {
    const employers = [
      createEmployer({
        id: 'emp-1',
        name: 'Summit Electrical',
        industries: { id: 'ind-1', name: 'Construction' },
      }),
      createEmployer({
        id: 'emp-2',
        name: 'Northwind Plumbing',
        industries: { id: 'ind-2', name: 'Plumbing' },
      }),
      createEmployer({
        id: 'emp-3',
        name: 'Skyline Roofing',
        industries: { id: 'ind-3', name: 'Roofing' },
      }),
      createEmployer({
        id: 'emp-4',
        name: 'Tech Solutions',
        industries: { id: 'ind-4', name: 'Technology' },
      }),
    ]

    // Select multiple industries - should return employers matching ANY selected industry
    const filtered = filterEmployers(employers, {
      searchQuery: '',
      selectedIndustries: ['Construction', 'Plumbing'],
    })

    // Should return 2 employers (one Construction, one Plumbing)
    expect(filtered).toHaveLength(2)
    expect(filtered.map((e) => e.id)).toEqual(['emp-1', 'emp-2'])
  })

  it('returns all matching employers when multiple industries selected', () => {
    const employers = [
      createEmployer({
        id: 'emp-1',
        name: 'Summit Electrical',
        industries: { id: 'ind-1', name: 'Construction' },
      }),
      createEmployer({
        id: 'emp-2',
        name: 'Another Construction',
        industries: { id: 'ind-1', name: 'Construction' },
      }),
      createEmployer({
        id: 'emp-3',
        name: 'Plumbing Co',
        industries: { id: 'ind-2', name: 'Plumbing' },
      }),
    ]

    const filtered = filterEmployers(employers, {
      searchQuery: '',
      selectedIndustries: ['Construction', 'Plumbing'],
    })

    // Should return all 3 employers (2 Construction + 1 Plumbing)
    expect(filtered).toHaveLength(3)
  })

  it('returns empty array when no employers match selected industries', () => {
    const employers = [
      createEmployer({
        id: 'emp-1',
        name: 'Summit Electrical',
        industries: { id: 'ind-1', name: 'Construction' },
      }),
      createEmployer({
        id: 'emp-2',
        name: 'Plumbing Co',
        industries: { id: 'ind-2', name: 'Plumbing' },
      }),
    ]

    const filtered = filterEmployers(employers, {
      searchQuery: '',
      selectedIndustries: ['Technology', 'Healthcare'],
    })

    expect(filtered).toHaveLength(0)
  })

  it('combines search query with industry filter (AND logic between query and industries)', () => {
    extractPlainText.mockReturnValue('Commercial electrical installations')

    const employers = [
      createEmployer({
        id: 'emp-1',
        name: 'Summit Electrical',
        industries: { id: 'ind-1', name: 'Construction' },
        description: { type: 'doc' } as any,
      }),
      createEmployer({
        id: 'emp-2',
        name: 'Commercial Builders',
        industries: { id: 'ind-1', name: 'Construction' },
        description: 'Residential construction',
      }),
      createEmployer({
        id: 'emp-3',
        name: 'Electrical Services',
        industries: { id: 'ind-2', name: 'Plumbing' },
        description: 'Commercial electrical',
      }),
    ]

    // Search for "commercial" AND filter by "Construction" industry
    const filtered = filterEmployers(employers, {
      searchQuery: 'commercial',
      selectedIndustries: ['Construction'],
    })

    // Should return only employers matching BOTH search query AND Construction industry
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('emp-1')
  })
})

