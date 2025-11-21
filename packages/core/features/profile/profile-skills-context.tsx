import { useToastController } from '@tamagui/toast'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ParentSkill, PendingSearch } from './types/profile-skills-types'
import { getSkillGuidanceForIndustry, type SkillSuggestion } from './constants/skill-guidance'
import { useProfileSkillsQueries } from './hooks/useProfileSkillsQueries'
import { useProfileSkillsMutations } from './hooks/useProfileSkillsMutations'

const createPendingSearchId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_INDUSTRY_SLUG = 'construction'

interface ProfileSkillsContextValue {
  isLoadingIndustries: boolean
  industries: ReturnType<typeof useProfileSkillsQueries>['industries']
  selectedIndustryId: string
  selectedIndustrySlug: string
  industryDisplayName: string
  handleIndustryChange: (industryId: string) => Promise<void>
  skillGuidance: ReturnType<typeof getSkillGuidanceForIndustry>
  skillCount: number
  hasMinimumSkills: boolean
  completionPercent: number
  handleSuggestionSelect: (suggestion: SkillSuggestion) => void
  pendingSearch: PendingSearch | null
  clearPendingSearch: () => void
  searchSkills: (query: string, taxonomies: string[]) => Promise<ParentSkill[]>
  selectSkill: (
    skillId: string,
    proficiency: number,
    taxonomy: string,
    skillDetails?: ParentSkill
  ) => Promise<void>
  isSearchingSkills: boolean
  existingSkillIds: string[]
  isAddingSkill: boolean
  isRemovingSkill: boolean
}

const ProfileSkillsContext = createContext<ProfileSkillsContextValue | null>(null)

interface ProfileSkillsProviderProps {
  children: ReactNode
}

export function ProfileSkillsProvider({ children }: ProfileSkillsProviderProps) {
  const toast = useToastController()
  const [pendingSearch, setPendingSearch] = useState<PendingSearch | null>(null)

  // Use extracted hooks
  const queries = useProfileSkillsQueries()
  const mutations = useProfileSkillsMutations()

  // Destructure stable values to prevent infinite loops
  // Extract callbacks separately to ensure they have stable references
  const {
    isLoadingIndustries,
    industries,
    selectedIndustryId,
    selectedIndustrySlug,
    existingSkillIds,
    skillCount,
    hasMinimumSkills,
    completionPercent,
    setSelectedIndustryId,
  } = queries

  // Extract mutations and callbacks - use refs to access mutations to prevent recreation
  const updateIndustryMutationRef = useRef(mutations.updateIndustryMutation)
  updateIndustryMutationRef.current = mutations.updateIndustryMutation

  const searchSkillsMutationRef = useRef(mutations.searchSkillsMutation)
  searchSkillsMutationRef.current = mutations.searchSkillsMutation

  const selectSkill = mutations.selectSkill
  const isSearchingSkills = mutations.isSearchingSkills
  const isAddingSkill = mutations.isAddingSkill
  const isRemovingSkill = mutations.isRemovingSkill

  // Handle industry change - use ref to access mutation to prevent callback recreation
  // Prevent infinite loops by only updating if value actually changed
  const handleIndustryChange = useCallback(
    async (industryId: string) => {
      // Don't do anything if the value hasn't changed
      if (industryId === selectedIndustryId) {
        return
      }

      try {
        // Update state first for immediate UI feedback
        setSelectedIndustryId(industryId)
        // Then update on server
        await updateIndustryMutationRef.current.mutateAsync({
          industryId,
        })
      } catch (error) {
        // Rollback state on error
        console.error('Failed to update industry:', error)
        // Optionally rollback to previous value
        // But for now, just let the error be handled by the mutation's onError
      }
    },
    [setSelectedIndustryId, selectedIndustryId] // Include selectedIndustryId to check for changes
  )

  // Handle suggestion select
  const handleSuggestionSelect = useCallback(
    (suggestion: SkillSuggestion) => {
      const searchTerm = suggestion.searchTerm ?? suggestion.label
      setPendingSearch({
        id: createPendingSearchId(),
        term: searchTerm,
        taxonomy: suggestion.taxonomy,
      })
      toast.show('Suggestion Applied', {
        message: `Searching for "${suggestion.label}"...`,
        duration: 2500,
      })
    },
    [toast]
  )

  const clearPendingSearch = useCallback(() => {
    setPendingSearch(null)
  }, [])

  // Search skills function - use ref to access mutation to prevent callback recreation
  const searchSkills = useCallback(
    async (query: string, taxonomies: string[]): Promise<ParentSkill[]> => {
      if (!selectedIndustryId || taxonomies.length === 0) {
        return []
      }

      try {
        const allResults: ParentSkill[] = []

        for (const taxonomy of taxonomies) {
          const result = await searchSkillsMutationRef.current.mutateAsync({
            query,
            industrySlug: taxonomy === 'csi' ? DEFAULT_INDUSTRY_SLUG : selectedIndustrySlug,
            limit: 20,
          })

          const skills = result.skills.map(
            (skill: {
              skill_id: string
              name: string
              display_code: string
              hierarchy_level: number | null
            }) => ({
              id: skill.skill_id,
              name: skill.name,
              code: skill.display_code,
              depth: skill.hierarchy_level || 0,
            })
          )

          allResults.push(...skills)
        }

        return allResults
      } catch (error) {
        console.error('Search error:', error)
        return []
      }
    },
    [selectedIndustryId, selectedIndustrySlug] // Only depends on primitive values
  )

  // Derived state
  const industryDisplayName = useMemo(
    () =>
      selectedIndustrySlug
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    [selectedIndustrySlug]
  )

  const skillGuidance = useMemo(
    () => getSkillGuidanceForIndustry(selectedIndustrySlug),
    [selectedIndustrySlug]
  )

  // Memoize context value - use primitive values and stable callbacks
  // Boolean values like isAddingSkill might change frequently but shouldn't cause loops
  const value: ProfileSkillsContextValue = useMemo(
    () => ({
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      selectedIndustrySlug,
      industryDisplayName,
      handleIndustryChange,
      skillGuidance,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      handleSuggestionSelect,
      pendingSearch,
      clearPendingSearch,
      searchSkills,
      selectSkill,
      isSearchingSkills,
      existingSkillIds,
      isAddingSkill,
      isRemovingSkill,
    }),
    [
      isLoadingIndustries,
      industries,
      selectedIndustryId,
      selectedIndustrySlug,
      industryDisplayName,
      handleIndustryChange,
      skillGuidance,
      skillCount,
      hasMinimumSkills,
      completionPercent,
      handleSuggestionSelect,
      pendingSearch,
      clearPendingSearch,
      searchSkills,
      selectSkill,
      isSearchingSkills,
      existingSkillIds,
      // Include boolean values - they should only change when mutations start/stop
      // If they're causing loops, something else is triggering mutations repeatedly
      isAddingSkill,
      isRemovingSkill,
    ]
  )

  return <ProfileSkillsContext.Provider value={value}>{children}</ProfileSkillsContext.Provider>
}

export function useProfileSkillsContext(): ProfileSkillsContextValue {
  const context = useContext(ProfileSkillsContext)
  if (!context) {
    throw new Error('useProfileSkillsContext must be used within a ProfileSkillsProvider')
  }

  return context
}
