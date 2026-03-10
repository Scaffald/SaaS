import { useState } from 'react'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { DiscoverJobsLeft } from './discover-jobs-left'
import { DiscoverJobsRight } from './discover-jobs-right'

/**
 * Discover Jobs Screen Component
 * Main screen for job discovery with search/filter on right and job list on left
 */
export function DiscoverJobsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])
  const [jobSource, setJobSource] = useState<'all' | 'internal' | 'external'>('all')
  const [minSoftSkillsMatch, setMinSoftSkillsMatch] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'match_score'>('relevance')

  return {
    left: (
      <DiscoverJobsLeft
        searchQuery={debouncedSearch}
        searchInputValue={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIndustries={selectedIndustries}
        selectedJobTypes={selectedJobTypes}
        jobSource={jobSource}
        minSoftSkillsMatch={minSoftSkillsMatch}
        sortBy={sortBy}
      />
    ),
    right: (
      <DiscoverJobsRight
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
        onIndustriesChange={setSelectedIndustries}
        onJobTypesChange={setSelectedJobTypes}
        jobSource={jobSource}
        onJobSourceChange={setJobSource}
        minSoftSkillsMatch={minSoftSkillsMatch}
        onMinSoftSkillsMatchChange={setMinSoftSkillsMatch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
    ),
  }
}
