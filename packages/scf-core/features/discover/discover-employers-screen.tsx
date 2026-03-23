import { useEmployers } from '@scf/core/utils/employers-sdk-hooks'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { useMemo, useState } from 'react'
import { useResponsive } from '@scaffald/ui'
import { PageHeader } from '@scf/core/components/PageHeader'
import type { FilterPillConfig } from '@scf/core/components/PageHeader'
import { EmployersBottomToolbar } from './components/EmployersBottomToolbar'
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
 *
 * Search/filter state lives here as the single source of truth.
 *   - Desktop+: PageHeader with search + filter pills (header)
 *   - Mobile: BottomToolbar with Sheets (footer)
 */
export function DiscoverEmployersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  const { isMobile } = useResponsive()

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

  const hasActiveFilters = searchQuery.length > 0 || selectedIndustries.length > 0

  // Filter pills for desktop header
  const filterPills = useMemo<FilterPillConfig[]>(() => {
    const pills: FilterPillConfig[] = []

    pills.push({
      id: 'industry',
      label: 'Industry',
      value: selectedIndustries.length > 0
        ? selectedIndustries.length === 1
          ? selectedIndustries[0]
          : `${selectedIndustries.length} selected`
        : undefined,
      isActive: selectedIndustries.length > 0,
      onPress: () => {},
    })

    return pills
  }, [selectedIndustries])

  // Header — desktop+ only
  const header = isMobile ? null : (
    <PageHeader
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search employers..."
      searchVariant="pill"
      filterPills={filterPills}
      resultCount={employers.length}
      resultLabel={employers.length === 1 ? 'Employer' : 'Employers'}
      onReset={hasActiveFilters ? handleClearFilters : undefined}
    />
  )

  // Footer — mobile only
  const footer = isMobile ? (
    <EmployersBottomToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      selectedIndustries={selectedIndustries}
      onIndustriesChange={setSelectedIndustries}
      availableIndustries={availableIndustries}
      hasFilters={hasActiveFilters}
      onReset={handleClearFilters}
    />
  ) : null

  return {
    header,
    left: (
      <DiscoverEmployersLeft
        employers={employers}
        isLoading={isLoading}
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
    footer,
  }
}
