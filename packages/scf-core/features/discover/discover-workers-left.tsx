import { useAuth } from '@scf/core/provider/auth/useAuth'
import { type RefObject, useMemo } from 'react'
import { Stack } from '@scaffald/ui'
import type { ResultListRef } from './components/ResultList'
import { ResultList } from './components/ResultList'
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
}

/**
 * Discover Workers Left Component
 * Left panel content for the workers discovery page - displays worker listings using map components
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

      // Search filter - matches name, title, or location
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          profile.name.toLowerCase().includes(query) ||
          profile.title.toLowerCase().includes(query) ||
          profile.locationLabel.toLowerCase().includes(query)

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

  return (
    <Stack flex={1} overflow="hidden">
      <ResultList
        ref={resultListRef}
        profiles={filteredProfiles}
        selectedId={selectedProfileId}
        onSelect={onSelect}
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => void refetch()}
      />
    </Stack>
  )
}
