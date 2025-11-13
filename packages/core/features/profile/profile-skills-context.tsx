import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
import type { ParentSkill } from './components/InlineSkillSearch'
import { getSkillGuidanceForIndustry, type SkillSuggestion } from './constants/skill-guidance'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from './utils/profile-sync-store'

type PendingSearch = { term: string; taxonomy: 'csi' | 'onet' | 'both' }

interface ProfileIndustry {
  id: string
  name: string
  slug: string
}

interface ProfileSkillsContextValue {
  isLoadingIndustries: boolean
  industries: ProfileIndustry[]
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
}

const DEFAULT_INDUSTRY_SLUG = 'construction'

const ProfileSkillsContext = createContext<ProfileSkillsContextValue | null>(null)

interface ProfileSkillsProviderProps {
  children: ReactNode
}

export function ProfileSkillsProvider({ children }: ProfileSkillsProviderProps) {
  const toast = useToastController()
  const utils = api.useContext()
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('')
  const [pendingSearch, setPendingSearch] = useState<PendingSearch | null>(null)

  const { data: industriesData, isLoading: isLoadingIndustries } =
    api.profile.skillsMultiTaxonomy.getIndustries.useQuery()
  const { data: primaryIndustryData } =
    api.profile.skillsMultiTaxonomy.getPrimaryIndustry.useQuery()

  const userSkillsQuery = api.profile.skillsMultiTaxonomy.getUserSkills.useQuery()

  // Store skill details for optimistic updates (accessed in onMutate)
  const pendingSkillDetailsRef = useRef<ParentSkill | null>(null)

  const addSkillMutation = api.profile.skillsMultiTaxonomy.addSkill.useMutation({
    async onMutate(variables: { taxonomy: 'csi' | 'onet'; skillId: string; proficiencyLevel: number }) {
      resetProfileSyncError()
      startProfileSync()

      // Cancel outgoing refetches to avoid overwriting optimistic update
      await utils.profile.skillsMultiTaxonomy.getUserSkills.cancel()

      // Snapshot previous value for rollback
      const previousSkills =
        utils.profile.skillsMultiTaxonomy.getUserSkills.getData()

      // Get skill details from ref (set by selectSkill before mutation)
      const skillDetails = pendingSkillDetailsRef.current

      // Optimistically update cache
      if (skillDetails) {
        utils.profile.skillsMultiTaxonomy.getUserSkills.setData(
          undefined,
          (old: { skills: unknown[] } | undefined) => {
            if (!old) return old
            const tempId = `temp-${Date.now()}`
            const newSkill = {
              id: tempId,
              skill_details: {
                name: skillDetails.name,
                display_code: skillDetails.code,
                hierarchy_level: skillDetails.depth,
              },
              proficiency_level: variables.proficiencyLevel,
              csi_skill_id: variables.taxonomy === 'csi' ? variables.skillId : null,
              onet_occupation_id:
                variables.taxonomy === 'onet' ? variables.skillId : null,
              created_at: new Date().toISOString(),
            }
            return {
              ...old,
              skills: [newSkill, ...(old.skills || [])],
            }
          }
        )
        // Clear ref after use
        pendingSkillDetailsRef.current = null
      }

      return { previousSkills }
    },
    onError: (error: Error, _variables: unknown, context: { previousSkills?: unknown } | undefined) => {
      // Rollback optimistic update
      if (context?.previousSkills !== undefined) {
        utils.profile.skillsMultiTaxonomy.getUserSkills.setData(
          undefined,
          context.previousSkills
        )
      }
      // Clear ref on error
      pendingSkillDetailsRef.current = null
      toast.show('Error', {
        message: error.message || 'Failed to add skill',
      })
      failProfileSync()
    },
    onSuccess: async () => {
      toast.show('Skill Added', {
        message: 'Skill has been added to your profile!',
      })
      // Invalidate to get real server data (replaces temporary ID)
      await utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate()
      completeProfileSync()
    },
    onSettled: (_data: unknown, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
    },
  })

  const updateIndustryMutation =
    api.profile.skillsMultiTaxonomy.updatePrimaryIndustry.useMutation({
    onMutate: () => {
      resetProfileSyncError()
      startProfileSync()
    },
    onSuccess: async () => {
      toast.show('Industry Updated', {
        message: 'Your primary industry has been updated',
      })
      await invalidateProfileQueries(utils)
    },
    onError: (error: Error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update industry',
      })
      failProfileSync()
    },
    onSettled: (_data: unknown, error: unknown) => {
      if (!error) {
        completeProfileSync()
      }
    },
  })

  const searchSkillsMutation = api.profile.skillsMultiTaxonomy.searchSkills.useMutation()

  useEffect(() => {
    if (primaryIndustryData?.primary_industry_id && !selectedIndustryId) {
      setSelectedIndustryId(primaryIndustryData.primary_industry_id)
    }
  }, [primaryIndustryData, selectedIndustryId])

  const industries: ProfileIndustry[] = useMemo(() => {
    if (!industriesData?.industries) {
      return []
    }

    return industriesData.industries
      .filter((industry: unknown): industry is ProfileIndustry => {
        if (!industry || typeof industry !== 'object') {
          return false
        }
        const candidate = industry as {
          id?: unknown
          name?: unknown
          slug?: unknown
        }
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.slug === 'string'
        )
      })
      .map((industry: ProfileIndustry) => ({
        id: industry.id,
        name: industry.name,
        slug: industry.slug,
      }))
  }, [industriesData])

  const selectedIndustrySlug = useMemo(() => {
    const matchingIndustry = industries.find(
      (industry: ProfileIndustry) => industry.id === selectedIndustryId
    )
    return matchingIndustry?.slug ?? DEFAULT_INDUSTRY_SLUG
  }, [industries, selectedIndustryId])

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

  const skillCount = userSkillsQuery.data?.skills?.length ?? 0
  const hasMinimumSkills = skillCount >= 5
  const completionPercent = Math.min(Math.round((skillCount / 5) * 100), 100)

  const handleIndustryChange = useCallback(
    async (industryId: string) => {
      setSelectedIndustryId(industryId)
      await updateIndustryMutation.mutateAsync({
        industryId,
      })
    },
    [updateIndustryMutation]
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: SkillSuggestion) => {
      const searchTerm = suggestion.searchTerm ?? suggestion.label
      setPendingSearch({
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

  const searchSkills = useCallback(
    async (query: string, taxonomies: string[]): Promise<ParentSkill[]> => {
      if (!selectedIndustryId || taxonomies.length === 0) {
        return []
      }

      try {
        const allResults: ParentSkill[] = []

        for (const taxonomy of taxonomies) {
          const result = await searchSkillsMutation.mutateAsync({
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
    [selectedIndustryId, selectedIndustrySlug, searchSkillsMutation]
  )

  const selectSkill = useCallback(
    async (
      skillId: string,
      proficiency: number,
      taxonomy: string,
      skillDetails?: ParentSkill
    ) => {
      // Store skill details in ref for optimistic update
      if (skillDetails) {
        pendingSkillDetailsRef.current = skillDetails
      }
      await addSkillMutation.mutateAsync({
        taxonomy,
        skillId,
        proficiencyLevel: proficiency,
      })
    },
    [addSkillMutation]
  )

  const existingSkillIds =
    userSkillsQuery.data?.skills.map((skill: { id: string; csi_skill_id: string | null; onet_occupation_id: string | null }) =>
      skill.csi_skill_id || skill.onet_occupation_id || skill.id
    ) || []

  const value: ProfileSkillsContextValue = {
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
    isSearchingSkills: searchSkillsMutation.isPending,
    existingSkillIds,
    isAddingSkill: addSkillMutation.isPending,
  }

  return <ProfileSkillsContext.Provider value={value}>{children}</ProfileSkillsContext.Provider>
}

export function useProfileSkillsContext(): ProfileSkillsContextValue {
  const context = useContext(ProfileSkillsContext)
  if (!context) {
    throw new Error('useProfileSkillsContext must be used within a ProfileSkillsProvider')
  }

  return context
}

