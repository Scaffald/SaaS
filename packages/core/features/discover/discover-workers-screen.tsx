import { useState, useRef } from 'react'
import type { ResultListRef } from './components/ResultList'
import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'

/**
 * Discover Workers Screen Component
 * Main screen for worker discovery with search/filter on right and worker list on left
 */
export function DiscoverWorkersScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [minScore, setMinScore] = useState(0)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const resultListRef = useRef<ResultListRef>(null)

  const handleSelect = (id: string) => {
    setSelectedProfileId(id)
    // Optionally scroll to the selected profile
    setTimeout(() => {
      resultListRef.current?.scrollToCard(id)
    }, 100)
  }

  return {
    left: (
      <DiscoverWorkersLeft
        searchQuery={searchQuery}
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
        onSearchChange={setSearchQuery}
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
