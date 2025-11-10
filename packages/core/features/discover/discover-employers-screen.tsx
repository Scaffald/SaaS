import { useMemo, useState } from 'react'
import { api } from '@app/core/utils/api'
import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'
import {
  filterEmployers,
  getAvailableIndustries,
  getSelectedIndustryCounts,
} from './utils/employerFilters'

/**
 * Discover Employers Screen Component
 * Main screen for employer discovery with search/filter on right and employer list on left
 */
export function DiscoverEmployersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const { data, isLoading } = api.employers.getEmployers.useQuery()

  const employers = data?.employers ?? []

  const availableIndustries = useMemo(
    () => getAvailableIndustries(employers),
    [employers],
  )

  const filteredEmployers = useMemo(
    () => filterEmployers(employers, { searchQuery, selectedIndustries }),
    [employers, searchQuery, selectedIndustries],
  )

  const selectedIndustryCounts = useMemo(
    () => getSelectedIndustryCounts(filteredEmployers, selectedIndustries),
    [filteredEmployers, selectedIndustries],
  )

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedIndustries([])
  }

  return {
    left: (
      <DiscoverEmployersLeft employers={filteredEmployers} isLoading={isLoading} />
    ),
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
