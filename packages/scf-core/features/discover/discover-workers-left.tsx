import { useAuth } from '@scf/core/provider/auth/useAuth'
import { type RefObject, useMemo } from 'react'
import { Stack } from '@scaffald/ui'
import type { ResultListRef } from './components/ResultList'
import { ResultList } from './components/ResultList'
import type { WorkerSortBy } from './components/WorkersBottomToolbar'
import { useTalentProfiles } from './hooks/useTalentProfiles'

interface DiscoverWorkersLeftProps {
  searchQuery: string
  selectedIndustries: string[]
  minScore: number
  selectedSkills: string[]
  selectedCertifications: string[]
  selectedProfileId: string | null
  onSelect: (id: string) => void
  resultListRef: RefObject<ResultListRef | null>
  /** Sort order for the results list */
  sortBy?: WorkerSortBy
}

/**
 * Discover Workers Left Component
 * Left panel content for the workers discovery page - displays worker listings
 */
export function DiscoverWorkersLeft({
  searchQuery,
  selectedIndustries: _selectedIndustries,
  minScore,
  selectedSkills,
  selectedCertifications,
  selectedProfileId,
  onSelect,
  resultListRef,
  sortBy = 'score',
}: DiscoverWorkersLeftProps) {
  // Fetch workers using the same hook as the map page
  const { data: talentProfiles = [], isLoading, error, refetch } = useTalentProfiles()
  const { session } = useAuth()
  const currentUserId = session?.user?.id ?? null

  // Filter workers based on search and filters
  const filteredProfiles = useMemo(() => {
    return talentProfiles.filter((profile) => {
      if (currentUserId && profile.id === currentUserId) {
        return false
      }

      // Search filter - matches name, title, location, skills, certifications
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          profile.name.toLowerCase().includes(query) ||
          profile.title.toLowerCase().includes(query) ||
          profile.locationLabel.toLowerCase().includes(query) ||
          profile.skills.some((s) => s.toLowerCase().includes(query)) ||
          profile.certifications.some((c) => c.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Score filter
      if (profile.score < minScore) {
        return false
      }

      // Skills filter - worker must have at least one selected skill
      if (selectedSkills.length > 0) {
        const hasMatchingSkill = selectedSkills.some((selectedSkill) =>
          profile.skills.some((skill) => skill.toLowerCase().includes(selectedSkill.toLowerCase()))
        )
        if (!hasMatchingSkill) return false
      }

      // Certifications filter - worker must have at least one selected certification
      if (selectedCertifications.length > 0) {
        const hasMatchingCert = selectedCertifications.some((selectedCert) =>
          profile.certifications.some((cert) =>
            cert.toLowerCase().includes(selectedCert.toLowerCase())
          )
        )
        if (!hasMatchingCert) return false
      }

      return true
    })
  }, [talentProfiles, searchQuery, minScore, selectedSkills, selectedCertifications, currentUserId])

  // Sort filtered results
  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles]
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.score - a.score)
      case 'experience':
        return sorted.sort((a, b) => b.experienceYears - a.experienceYears)
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return sorted
    }
  }, [filteredProfiles, sortBy])

  return (
    <Stack style={{ flex: 1, overflow: 'hidden' }}>
      <ResultList
        ref={resultListRef}
        profiles={sortedProfiles}
        selectedId={selectedProfileId}
        onSelect={onSelect}
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => void refetch()}
        profileCardVariant="directory"
      />
    </Stack>
  )
}
