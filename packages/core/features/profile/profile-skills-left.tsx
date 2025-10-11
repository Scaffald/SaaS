import { useState, useEffect, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  H4,
  ScrollView,
  Spinner,
  Card,
  Select,
  Adapt,
  Sheet,
  Separator,
  useWindowDimensions,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { Plus, X, ChevronRight } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'
import { SkillSearchModal, type ParentSkill, type SkillChild } from '@app/ui'

/**
 * Proficiency level display helper
 */
const PROFICIENCY_LABELS = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
} as const

/**
 * Profile Skills Left Component
 * Form for managing skills with industry-based search
 */
export function ProfileSkillsLeft() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const toast = useToastController()
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  // Fetch industries
  const { data: industriesData, isLoading: isLoadingIndustries } =
    api.profile.getIndustries.useQuery()

  // Fetch user's skills
  const {
    data: userSkillsData,
    isLoading: isLoadingSkills,
    refetch: refetchSkills,
  } = api.profile.getUserSkills.useQuery()

  // Get primary industry
  const { data: primaryIndustryData } = api.profile.getPrimaryIndustry.useQuery()

  // Mutations
  const addSkillMutation = api.profile.addSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Added', {
        message: 'Skill has been added to your profile!',
      })
      refetchSkills()
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      toast.show('Error', {
        message: error.message || 'Failed to add skill',
      })
    },
  })

  const updateSkillMutation = api.profile.updateSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Updated', {
        message: 'Skill proficiency has been updated!',
      })
      refetchSkills()
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      toast.show('Error', {
        message: error.message || 'Failed to update skill',
      })
    },
  })

  const removeSkillMutation = api.profile.removeSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Removed', {
        message: 'Skill has been removed from your profile',
      })
      refetchSkills()
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      toast.show('Error', {
        message: error.message || 'Failed to remove skill',
      })
    },
  })

  const updateIndustryMutation = api.profile.updatePrimaryIndustry.useMutation({
    onSuccess: () => {
      toast.show('Industry Updated', {
        message: 'Your primary industry has been updated',
      })
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      toast.show('Error', {
        message: error.message || 'Failed to update industry',
      })
    },
  })

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

  // Multi-taxonomy skill search
  const searchSkillsMutation = api.profile.searchSkills.useMutation()

  // Handle skill search (adapted for multi-taxonomy)
  const handleSearchParents = useCallback(
    async (query: string): Promise<ParentSkill[]> => {
      if (!selectedIndustry) {
        return []
      }

      setIsSearching(true)
      try {
        const result = await searchSkillsMutation.mutateAsync({
          query,
          industrySlug: selectedIndustrySlug,
          limit: 20,
        })
        // Convert multi-taxonomy results to ParentSkill format
        return result.skills.map(
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
      } catch (error) {
        console.error('Search error:', error)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    [selectedIndustry, selectedIndustrySlug, searchSkillsMutation]
  )

  // Handle get skill children - not applicable for multi-taxonomy
  const handleGetChildren = useCallback(async (_parentId: string): Promise<SkillChild[]> => {
    // Multi-taxonomy doesn't have hierarchical children
    return []
  }, [])

  // Get user skills (adapted for new structure)
  const userSkills = userSkillsData?.skills || []

  // Get existing skill IDs for highlighting in modal
  const existingSkillIds = userSkills.map(
    (skill: { id: string; csi_skill_id: string | null; onet_occupation_id: string | null }) =>
      skill.csi_skill_id || skill.onet_occupation_id || skill.id
  )

  // Handle skill selection from modal
  const handleSelectSkill = useCallback(
    async (skillId: string, proficiency: number) => {
      // Determine taxonomy based on industry
      const taxonomy = selectedIndustrySlug === 'construction' ? 'csi' : 'onet'
      await addSkillMutation.mutateAsync({
        taxonomy,
        skillId,
        proficiencyLevel: proficiency,
      })
    },
    [addSkillMutation, selectedIndustrySlug]
  )

  // Handle skill update from modal
  const handleUpdateSkill = useCallback(
    async (userSkillId: string, proficiency: number) => {
      await updateSkillMutation.mutateAsync({
        userSkillId,
        proficiencyLevel: proficiency,
      })
    },
    [updateSkillMutation]
  )

  // Handle remove skill
  const handleRemoveSkill = useCallback(
    async (userSkillId: string) => {
      await removeSkillMutation.mutateAsync({ userSkillId })
    },
    [removeSkillMutation]
  )

  if (isLoadingIndustries || isLoadingSkills) {
    return (
      <YStack gap="$4" p="$4" flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text>Loading...</Text>
      </YStack>
    )
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashboardWidget>
          <YStack gap="$4" p="$4" flex={1}>
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

                <Adapt when={isMobile} platform="touch">
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

            {/* Skills List */}
            <YStack gap="$3">
              <XStack justify="space-between" items="center">
                <Text fontWeight="600">Your Skills</Text>
                <Button
                  size="$3"
                  onPress={() => setIsModalOpen(true)}
                  icon={Plus}
                  disabled={!selectedIndustry}
                  opacity={!selectedIndustry ? 0.5 : 1}
                >
                  Add Skill
                </Button>
              </XStack>

              {!selectedIndustry && (
                <Card bordered bg="$color3" p="$3">
                  <Text fontSize="$2" color="$color11" text="center">
                    Please select an industry to add skills
                  </Text>
                </Card>
              )}

              {userSkills.length === 0 && selectedIndustry && (
                <YStack p="$4" items="center" gap="$2">
                  <Text color="$color11">No skills added yet</Text>
                </YStack>
              )}

              {userSkills.map(
                (skill: {
                  id: string
                  skill_details: {
                    name: string
                    display_code: string
                    hierarchy_level: number | null
                  } | null
                  proficiency_level: number | null
                }) => (
                  <Card key={skill.id} bordered size="$4">
                    <Card.Header gap="$2">
                      {/* Skill Name and Code */}
                      <YStack gap="$1">
                        <Text fontSize="$4" fontWeight="600">
                          {skill.skill_details?.name || 'Unknown Skill'}
                        </Text>
                        {skill.skill_details?.display_code && (
                          <Text fontSize="$2" color="$color10">
                            Code: {skill.skill_details.display_code}
                          </Text>
                        )}
                      </YStack>

                      {/* Proficiency */}
                      <XStack justify="space-between" items="center" pt="$2">
                        <YStack gap="$1">
                          <Text fontSize="$2" color="$color11">
                            Proficiency
                          </Text>
                          <Text fontWeight="600" fontSize="$3">
                            {skill.proficiency_level &&
                              PROFICIENCY_LABELS[
                                skill.proficiency_level as keyof typeof PROFICIENCY_LABELS
                              ]}{' '}
                            ({skill.proficiency_level}/5)
                          </Text>
                        </YStack>

                        <XStack gap="$2">
                          <Button
                            size="$2"
                            variant="outlined"
                            icon={X}
                            onPress={() => handleRemoveSkill(skill.id)}
                            disabled={removeSkillMutation.isPending}
                          >
                            Remove
                          </Button>
                        </XStack>
                      </XStack>
                    </Card.Header>
                  </Card>
                )
              )}
            </YStack>
          </YStack>
        </DashboardWidget>
      </ScrollView>

      {/* Skill Search Modal */}
      <SkillSearchModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectSkill={handleSelectSkill}
        onUpdateSkill={handleUpdateSkill}
        onSearchParents={handleSearchParents}
        onGetChildren={handleGetChildren}
        isSearching={isSearching}
        existingSkillIds={existingSkillIds}
      />
    </>
  )
}
