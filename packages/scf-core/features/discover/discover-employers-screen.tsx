import { useEmployers } from '@scf/core/utils/employers-sdk-hooks'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { useMemo, useState } from 'react'
import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'
import { getAvailableIndustries, getSelectedIndustryCounts } from './utils/employerFilters'
import type { Employer } from './components/EmployerCard'

/**
 * Transform API EmployerRecord to component Employer type
 * Maps website → website_url and preserves other fields
 */
function transformEmployerRecord(record: unknown): Employer | unknown {
  if (!record || typeof record !== 'object') {
    return record
  }

  const data = record as Record<string, unknown>
  return {
    id: data.id ?? '',
    name: data.name ?? '',
    slug: data.slug ?? '',
    description: data.description ?? null,
    website_url: (data.website_url as string | null) ?? (data.website as string | null) ?? null,
    employee_count_range: (data.employee_count_range as string | null) ?? null,
    annual_revenue_range: (data.annual_revenue_range as string | null) ?? null,
    address: data.address ?? null,
    industries: data.industries ?? null,
    created_at: (data.created_at as string) ?? new Date().toISOString(),
  } as Employer
}

/**
 * Discover Employers Screen Component
 * Main screen for employer discovery with search/filter on right and employer list on left
 */
export function DiscoverEmployersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  // Fetch all employers (no filters) to build industry name-to-ID mapping
  // React Query will cache this, so it won't cause duplicate requests
  const { data: allData, isLoading: isLoadingAll } = useEmployers()
  const allEmployers: Employer[] = (allData?.employers ?? []).map(
    (emp: unknown) => transformEmployerRecord(emp) as Employer
  )

  // Create industry name to ID mapping from all employers
  const industryNameToIdMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const employer of allEmployers) {
      if (Array.isArray(employer.industries)) {
        for (const ind of employer.industries) {
          if (ind && typeof ind === 'object' && 'id' in ind && 'name' in ind) {
            const industry = ind as { id: string; name: string }
            if (industry.id && industry.name) {
              map.set(industry.name, industry.id)
            }
          }
        }
      } else if (
        employer.industries &&
        typeof employer.industries === 'object' &&
        'id' in employer.industries &&
        'name' in employer.industries
      ) {
        const industry = employer.industries as { id: string; name: string }
        if (industry.id && industry.name) {
          map.set(industry.name, industry.id)
        }
      }
    }
    return map
  }, [allEmployers])

  // Convert selected industry names to IDs
  const selectedIndustryIds = useMemo(
    () =>
      selectedIndustries
        .map((name) => industryNameToIdMap.get(name))
        .filter((id): id is string => Boolean(id)),
    [selectedIndustries, industryNameToIdMap]
  )

  // Fetch filtered employers from backend (uses debounced search to avoid rapid API calls)
  const hasFilters = debouncedSearch.trim().length > 0 || selectedIndustryIds.length > 0
  const { data, isLoading: isLoadingFiltered } = useEmployers(
    {
      search: debouncedSearch.trim() || undefined,
      industry: selectedIndustryIds.length > 0 ? selectedIndustryIds[0] : undefined,
    },
    {
      // Only use filtered query when filters are applied, otherwise use cached all-data
      enabled: hasFilters,
    }
  )

  // Use filtered results when filters are applied, otherwise use all employers
  const employers: Employer[] = hasFilters
    ? (data?.employers ?? []).map((emp: unknown) => transformEmployerRecord(emp) as Employer)
    : allEmployers
  const isLoading = hasFilters ? isLoadingFiltered : isLoadingAll

  const availableIndustries = useMemo(() => getAvailableIndustries(allEmployers), [allEmployers])

  const selectedIndustryCounts = useMemo(
    () => getSelectedIndustryCounts(employers as Employer[], selectedIndustries),
    [employers, selectedIndustries]
  )

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedIndustries([])
  }

  return {
    left: (
      <DiscoverEmployersLeft
        employers={employers}
        isLoading={isLoading}
        searchInputValue={searchQuery}
        onSearchChange={setSearchQuery}
      />
    ),
    right: (
      <DiscoverEmployersRight
        searchQuery={searchQuery}
        industries={availableIndustries}
        industryCounts={selectedIndustryCounts}
        selectedIndustries={selectedIndustries}
        onClearSearch={() => setSearchQuery('')}
        onIndustriesChange={setSelectedIndustries}
        onClearFilters={handleClearFilters}
      />
    ),
  }
}
