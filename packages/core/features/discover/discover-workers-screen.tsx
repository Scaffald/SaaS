import { useState } from 'react'
import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'

/**
 * Discover Workers Screen Component
 * Main screen for worker discovery with search/filter on right and worker list on left
 */
export function DiscoverWorkersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  return {
    left: <DiscoverWorkersLeft searchQuery={searchQuery} selectedIndustries={selectedIndustries} />,
    right: (
      <DiscoverWorkersRight
        onSearchChange={setSearchQuery}
        onIndustriesChange={setSelectedIndustries}
      />
    ),
  }
}
