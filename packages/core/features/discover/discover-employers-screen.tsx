import { api } from '@app/core/utils/api'
import { useMemo, useState } from 'react'
import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'
import { getAvailableIndustries, getSelectedIndustryCounts } from './utils/employerFilters'

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
  const allEmployers = allData?.employers ?? []

  // Create industry name to ID mapping from all employers
  const industryNameToIdMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const employer of allEmployers) {
      if (employer.industries?.id && employer.industries?.name) {
        map.set(employer.industries.name, employer.industries.id)
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
  const employers = hasFilters ? (data?.employers ?? []) : allEmployers
  const isLoading = hasFilters ? isLoadingFiltered : isLoadingAll

  const availableIndustries = useMemo(() => getAvailableIndustries(allEmployers), [allEmployers])

  const selectedIndustryCounts = useMemo(
    () => getSelectedIndustryCounts(employers, selectedIndustries),
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
