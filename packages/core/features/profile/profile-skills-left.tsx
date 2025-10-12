import { useState, useEffect, useCallback } from 'react'
import { YStack, XStack, Text, H4, Select, Adapt, Sheet, Separator, Spinner } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
import { ProfileFormPanel, InlineSkillSearch } from './components'
import type { ParentSkill } from './components/InlineSkillSearch'

/**
 * Profile Skills Left Component
 * Inline form for searching and adding skills
 */
export function ProfileSkillsLeft() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const toast = useToastController()

  // Fetch industries
  const { data: industriesData, isLoading: isLoadingIndustries } =
    api.profile.getIndustries.useQuery()

  // Get primary industry
  const { data: primaryIndustryData } = api.profile.getPrimaryIndustry.useQuery()

  // Get user skills for refetching
  const userSkillsQuery = api.profile.getUserSkills.useQuery()

  // Mutations
  const addSkillMutation = api.profile.addSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Added', {
        message: 'Skill has been added to your profile!',
      })
      // Refetch skills to update the right column
      userSkillsQuery.refetch()
    },
    onError: (error: Error) => {
      toast.show('Error', {
        message: error.message || 'Failed to add skill',
      })
    },
  })

  const updateIndustryMutation = api.profile.updatePrimaryIndustry.useMutation({
    onSuccess: () => {
      toast.show('Industry Updated', {
        message: 'Your primary industry has been updated',
      })
    },
    onError: (error: Error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update industry',
      })
    },
  })

  // Multi-taxonomy skill search
  const searchSkillsMutation = api.profile.searchSkills.useMutation()

  // Set initial industry from user data
  useEffect(() => {
    if (primaryIndustryData?.primary_industry_id && !selectedIndustry) {
      setSelectedIndustry(primaryIndustryData.primary_industry_id)
    }
  }, [primaryIndustryData, selectedIndustry])

  // Handle industry change
  const handleIndustryChange = useCallback(
    async (industryId: string) => {
      setSelectedIndustry(industryId)
      await updateIndustryMutation.mutateAsync({
        industryId,
      })
    },
    [updateIndustryMutation]
  )

  // Get industry slug for search
  const selectedIndustrySlug =
    industriesData?.industries.find(
      // biome-ignore lint/suspicious/noExplicitAny: API response type
      (ind: any) => ind.id === selectedIndustry
    )?.slug || 'construction'

  // Handle skill search with multiple taxonomies
  const handleSearchSkills = useCallback(
    async (query: string, taxonomies: string[]): Promise<ParentSkill[]> => {
      if (!selectedIndustry || taxonomies.length === 0) {
        return []
      }

      try {
        // Search across all selected taxonomies
        const allResults: ParentSkill[] = []

        for (const taxonomy of taxonomies) {
          const result = await searchSkillsMutation.mutateAsync({
            query,
            industrySlug: taxonomy === 'csi' ? 'construction' : selectedIndustrySlug,
            limit: 20,
          })

          // Convert multi-taxonomy results to ParentSkill format
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
    [selectedIndustry, selectedIndustrySlug, searchSkillsMutation]
  )

  // Handle skill selection with explicit taxonomy
  const handleSelectSkill = useCallback(
    async (skillId: string, proficiency: number, taxonomy: string) => {
      await addSkillMutation.mutateAsync({
        taxonomy,
        skillId,
        proficiencyLevel: proficiency,
      })
    },
    [addSkillMutation]
  )

  // Get user skills for existing IDs
  const { data: userSkillsData } = api.profile.getUserSkills.useQuery()
  const existingSkillIds =
    userSkillsData?.skills.map(
      (skill: { id: string; csi_skill_id: string | null; onet_occupation_id: string | null }) =>
        skill.csi_skill_id || skill.onet_occupation_id || skill.id
    ) || []

  if (isLoadingIndustries) {
    return (
      <ProfileFormPanel>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </ProfileFormPanel>
    )
  }

  return (
    <ProfileFormPanel>
      <H4>Skills & Expertise</H4>

      {/* Industry Selector */}
      <YStack gap="$2">
        <Text fontWeight="600">Primary Industry *</Text>
        <Text fontSize="$2" color="$color11">
          Select your industry to search for relevant skills
        </Text>
        <Select value={selectedIndustry} onValueChange={handleIndustryChange} size="$4">
          <Select.Trigger width="100%">
            <Select.Value placeholder="Select an industry" />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet
              native
              modal
              dismissOnSnapToBottom
              animationConfig={{
                type: 'spring',
                damping: 20,
                mass: 1.2,
                stiffness: 250,
              }}
            >
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
              />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              {/* biome-ignore lint/suspicious/noExplicitAny: API response type */}
              {industriesData?.industries.map((industry: any, index: number) => (
                <Select.Item key={industry.id} value={industry.id} index={index}>
                  <Select.ItemText>{industry.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </YStack>

      <Separator />

      {/* Inline Skill Search */}
      {!selectedIndustry ? (
        <YStack p="$4" items="center" gap="$2" bg="$color3" rounded="$4">
          <Text fontSize="$3" color="$color11" text="center">
            Please select an industry above to search for skills
          </Text>
        </YStack>
      ) : (
        <InlineSkillSearch
          onSearchSkills={handleSearchSkills}
          onSelectSkill={handleSelectSkill}
          isSearching={searchSkillsMutation.isPending}
          existingSkillIds={existingSkillIds}
        />
      )}
    </ProfileFormPanel>
  )
}
