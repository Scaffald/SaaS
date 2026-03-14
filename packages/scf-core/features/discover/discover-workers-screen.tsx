import { useRef, useState } from 'react'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { DiscoverHeader } from './components/DiscoverHeader'
import type { ResultListRef } from './components/ResultList'
import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'

/**
 * Discover Workers Screen Component
 * Main screen for worker discovery with search/filter on right and worker list on left
 */
export function DiscoverWorkersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const resultListRef = useRef<ResultListRef>(null)

  const handleSelect = (id: string) => {
    setSelectedProfileId(id)
    setTimeout(() => {
      resultListRef.current?.scrollToCard(id)
    }, 100)
  }

  const handleReset = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setMinScore(0)
    setSelectedSkills([])
    setSelectedCertifications([])
  }

  const hasFilters =
    searchQuery.length > 0 ||
    selectedIndustries.length > 0 ||
    minScore > 0 ||
    selectedSkills.length > 0 ||
    selectedCertifications.length > 0

  return {
    header: (
      <DiscoverHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by name, title, or location..."
        onReset={hasFilters ? handleReset : undefined}
      />
    ),
    left: (
      <DiscoverWorkersLeft
        searchQuery={debouncedSearch}
        selectedIndustries={selectedIndustries}
        minScore={minScore}
        selectedSkills={selectedSkills}
        selectedCertifications={selectedCertifications}
        selectedProfileId={selectedProfileId}
        onSelect={handleSelect}
        resultListRef={resultListRef}
      />
    ),
    right: (
      <DiscoverWorkersRight
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
        onIndustriesChange={setSelectedIndustries}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        selectedSkills={selectedSkills}
        onSkillsChange={setSelectedSkills}
        selectedCertifications={selectedCertifications}
        onCertificationsChange={setSelectedCertifications}
      />
    ),
  }
}
