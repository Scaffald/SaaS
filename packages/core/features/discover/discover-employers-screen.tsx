import { api } from '@app/core/utils/api'
import { useMemo, useState } from 'react'
import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'
import { getAvailableIndustries, getSelectedIndustryCounts } from './utils/employerFilters'
import type { Employer } from './components/EmployerCard'

type RawEmployer = {
  id: string
  name: string
  slug: string
  description: unknown
  website: string | null
  website_url?: string | null
  visibility: string
  address: unknown
  industry_id: string | null
  industries?: { id: string; name: string } | { id: string; name: string }[] | null
  employee_count_range?: string | null
  annual_revenue_range?: string | null
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Discover Employers Screen Component
 * Main screen for employer discovery with search/filter on right and employer list on left
 */
export function DiscoverEmployersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  // Fetch all employers (no filters) to build industry name-to-ID mapping
  // React Query will cache this, so it won't cause duplicate requests
  const { data: allData, isLoading: isLoadingAll } = api.employers.getEmployers.useQuery()
  // biome-ignore lint/suspicious/noExplicitAny: Complex API response mapping
  const allEmployers: Employer[] = ((allData?.employers ?? []) as any[]).map((emp: any) => ({
    id: emp.id,
    name: emp.name,
    slug: emp.slug,
    description: emp.description ?? null,
    website_url: emp.website_url || emp.website || null,
    employee_count_range: emp.employee_count_range || null,
    annual_revenue_range: emp.annual_revenue_range || null,
    address: emp.address ?? null,
    industries: emp.industries ?? null,
    created_at: emp.created_at,
  }))

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
      } else if (employer.industries && typeof employer.industries === 'object' && 'id' in employer.industries && 'name' in employer.industries) {
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

  // Fetch filtered employers from backend
  const hasFilters = searchQuery.trim().length > 0 || selectedIndustryIds.length > 0
  const { data, isLoading: isLoadingFiltered } = api.employers.getEmployers.useQuery(
    {
      search: searchQuery.trim() || undefined,
      industryIds: selectedIndustryIds.length > 0 ? selectedIndustryIds : undefined,
    },
    {
      // Only use filtered query when filters are applied, otherwise use cached all-data
      enabled: hasFilters,
    }
  )

  // Use filtered results when filters are applied, otherwise use all employers
  const employers: Employer[] = hasFilters
    ? ((data?.employers ?? []).map((emp: RawEmployer) => ({
        ...emp,
        website_url: emp.website_url || emp.website || null,
        employee_count_range: emp.employee_count_range || null,
        annual_revenue_range: emp.annual_revenue_range || null,
      })) as Employer[])
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
    left: <DiscoverEmployersLeft employers={employers} isLoading={isLoading} />,
    right: (
      <DiscoverEmployersRight
        searchQuery={searchQuery}
        industries={availableIndustries}
        industryCounts={selectedIndustryCounts}
        selectedIndustries={selectedIndustries}
        onSearchChange={setSearchQuery}
        onIndustriesChange={setSelectedIndustries}
        onClearFilters={handleClearFilters}
      />
    ),
  }
}
