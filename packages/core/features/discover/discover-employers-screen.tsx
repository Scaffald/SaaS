import { useState } from 'react'
import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'

/**
 * Discover Employers Screen Component
 * Main screen for employer discovery with search/filter on right and employer list on left
 */
export function DiscoverEmployersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  return {
    left: (
      <DiscoverEmployersLeft searchQuery={searchQuery} selectedIndustries={selectedIndustries} />
    ),
    right: (
      <DiscoverEmployersRight
        onSearchChange={setSearchQuery}
        onIndustriesChange={setSelectedIndustries}
      />
    ),
  }
}
