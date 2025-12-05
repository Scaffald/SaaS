import { useCallback, useEffect, useRef, useState } from 'react'
import type { ParentSkill } from '../types/profile-skills-types'
import { SkillProficiencySelector } from './skills/SkillProficiencySelector'
import { SkillSearchForm } from './skills/SkillSearchForm'

// Re-export ParentSkill type for backwards compatibility
export type { ParentSkill } from '../types/profile-skills-types'

/**
 * Props for InlineSkillSearch
 */
export interface InlineSkillSearchProps {
  /** Function to search skills with taxonomies */
  onSearchSkills: (query: string, taxonomies: string[]) => Promise<ParentSkill[]>
  /** Callback when skill is selected and added */
  onSelectSkill: (
    skillId: string,
    proficiency: number,
    taxonomy: string,
    skillDetails?: ParentSkill
  ) => void
  /** Whether search is loading */
  isSearching?: boolean
  /** Existing skill IDs that user has already added */
  existingSkillIds?: string[]
  /** External term injected from parent (e.g., chip selection) */
  externalSearchTerm?: string | null
  /** Unique identifier for external search term */
  externalSearchId?: string | null
  /** Preferred taxonomy when external term provided */
  externalSearchTaxonomy?: 'csi' | 'onet' | 'both'
  /** Callback when external term has been consumed */
  onConsumeExternalSearchTerm?: () => void
}

/**
 * InlineSkillSearch Component
 *
 * Inline component for searching and selecting skills with proficiency
 *
 * @example
 * ```tsx
 * <InlineSkillSearch
 *   onSearchSkills={async (query, taxonomies) => {
 *     const result = await searchSkillsMutation.mutateAsync({ query, taxonomies })
 *     return result.skills
 *   }}
 *   onSelectSkill={(skillId, proficiency, taxonomy) => {
 *     addSkillMutation.mutate({ skillId, proficiency, taxonomy })
 *   }}
 *   existingSkillIds={userSkills.map(s => s.id)}
 * />
 * ```
 */
export function InlineSkillSearch({
  onSearchSkills,
  onSelectSkill,
  isSearching = false,
  existingSkillIds = [],
  externalSearchTerm,
  externalSearchId,
  externalSearchTaxonomy,
  onConsumeExternalSearchTerm,
}: InlineSkillSearchProps) {
  const [selectedSkill, setSelectedSkill] = useState<ParentSkill | null>(null)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>('csi')
  const [proficiency, setProficiency] = useState(1)
  const [searchCSI, setSearchCSI] = useState(true)
  const [searchONET, setSearchONET] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState('')
  const lastProcessedSearchKeyRef = useRef<string | null>(null)

  // Handle search with taxonomy filtering
  const handleSearch = useCallback(
    async (query: string): Promise<ParentSkill[]> => {
      if (query.trim().length < 2) {
        return []
      }

      const taxonomies: string[] = []
      if (searchCSI) taxonomies.push('csi')
      if (searchONET) taxonomies.push('onet')

      if (taxonomies.length === 0) {
        return []
      }

      const results = await onSearchSkills(query, taxonomies)

      // Filter out existing skills to prevent duplicates
      return results.filter((skill) => !existingSkillIds.includes(skill.id))
    },
    [onSearchSkills, searchCSI, searchONET, existingSkillIds]
  )

  // Apply external search term when provided (e.g., suggestion chip)
  useEffect(() => {
    if (!externalSearchTerm) {
      return
    }
    const searchKey = externalSearchId ?? externalSearchTerm
    if (lastProcessedSearchKeyRef.current === searchKey) {
      return
    }

    lastProcessedSearchKeyRef.current = searchKey

    if (externalSearchTaxonomy === 'onet') {
      setSearchCSI(false)
      setSearchONET(true)
    } else if (externalSearchTaxonomy === 'csi') {
      setSearchCSI(true)
      setSearchONET(false)
    } else if (externalSearchTaxonomy === 'both') {
      setSearchCSI(true)
      setSearchONET(true)
    } else {
      // Default to searching both taxonomies for suggestions
      setSearchCSI(true)
      setSearchONET(true)
    }

    setSearchInputValue(externalSearchTerm)

    const timeoutId = setTimeout(() => {
      onConsumeExternalSearchTerm?.()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [externalSearchId, externalSearchTerm, externalSearchTaxonomy, onConsumeExternalSearchTerm])

  // Handle skill selection
  const handleSkillSelect = useCallback((skill: ParentSkill, taxonomy: string) => {
    setSelectedSkill(skill)
    setSelectedTaxonomy(taxonomy)
    setProficiency(1) // Reset to default (Beginner)
  }, [])

  // Handle add skill
  const handleAddSkill = useCallback(() => {
    if (selectedSkill) {
      onSelectSkill(selectedSkill.id, proficiency, selectedTaxonomy, selectedSkill)
      // Reset to search mode but keep search query
      setSelectedSkill(null)
      setSelectedTaxonomy('csi')
      setProficiency(1) // Reset to default (Beginner)
    }
  }, [selectedSkill, proficiency, selectedTaxonomy, onSelectSkill])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setSelectedSkill(null)
    setProficiency(1) // Reset to default (Beginner)
  }, [])

  // If a skill is selected, show proficiency selector
  if (selectedSkill) {
    return (
      <SkillProficiencySelector
        skill={selectedSkill}
        taxonomy={selectedTaxonomy}
        proficiency={proficiency}
        onProficiencyChange={setProficiency}
        onAdd={handleAddSkill}
        onCancel={handleCancel}
      />
    )
  }

  // Show search interface
  return (
    <SkillSearchForm
      searchInputValue={searchInputValue}
      onInputChange={setSearchInputValue}
      searchCSI={searchCSI}
      onSearchCSIChange={setSearchCSI}
      searchONET={searchONET}
      onSearchONETChange={setSearchONET}
      onSearch={handleSearch}
      onSkillSelect={handleSkillSelect}
      isSearching={isSearching}
      existingSkillIds={existingSkillIds}
    />
  )
}
