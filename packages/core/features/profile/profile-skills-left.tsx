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
 * User skill with hierarchy information
 */
interface UserSkill {
  skill_id: string
  skill_name: string
  csi_display: string | null
  proficiency: number | null
  years_experience: number | null
  source: string
  last_verified_at: string | null
  hierarchy_path: string
  hierarchy_ids: string[]
  is_explicit: boolean
  depth: number
}

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

  // Get current skills data (legacy endpoint for industry)
  const { data: skillsData } = api.profile.getSkills.useQuery()

  // Mutations
  const addSkillMutation = api.profile.addUserSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Added', {
        message: 'Skill has been added to your profile!',
      })
      refetchSkills()
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to add skill',
      })
    },
  })

  const updateSkillMutation = api.profile.updateUserSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Updated', {
        message: 'Skill proficiency has been updated!',
      })
      refetchSkills()
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update skill',
      })
    },
  })

  const removeSkillMutation = api.profile.removeUserSkill.useMutation({
    onSuccess: () => {
      toast.show('Skill Removed', {
        message: 'Skill has been removed from your profile',
      })
      refetchSkills()
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to remove skill',
      })
    },
  })

  const updateIndustryMutation = api.profile.updateSkills.useMutation({
    onSuccess: () => {
      toast.show('Industry Updated', {
        message: 'Your primary industry has been updated',
      })
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update industry',
      })
    },
  })

  // Set initial industry from user data
  useEffect(() => {
    if (skillsData?.primary_industry_id && !selectedIndustry) {
      setSelectedIndustry(skillsData.primary_industry_id)
    }
  }, [skillsData, selectedIndustry])

  // Handle industry change
  const handleIndustryChange = useCallback(
    async (industryId: string) => {
      setSelectedIndustry(industryId)
      await updateIndustryMutation.mutateAsync({
        primary_industry_id: industryId,
      })
    },
    [updateIndustryMutation]
  )

  // NEW: Mutations for cascading skill selection
  const searchParentSkillsMutation = api.profile.searchParentSkills.useMutation()

  // Handle parent skill search
  const handleSearchParents = useCallback(
    async (query: string): Promise<ParentSkill[]> => {
      if (!selectedIndustry) {
        return []
      }

      setIsSearching(true)
      try {
        const result = await searchParentSkillsMutation.mutateAsync({
          query,
          industryId: selectedIndustry,
          limit: 20,
        })
        return result.skills
      } catch (error) {
        console.error('Search error:', error)
        return []
      } finally {
        setIsSearching(false)
      }
    },
    [selectedIndustry, searchParentSkillsMutation]
  )

  // Create tRPC utils for imperative queries
  const utils = api.useUtils()

  // Handle get skill children
  const handleGetChildren = useCallback(
    async (parentId: string): Promise<SkillChild[]> => {
      try {
        const result = await utils.profile.getSkillChildren.fetch({ parentId })
        return result.children || []
      } catch (error) {
        console.error('Error getting children:', error)
        return []
      }
    },
    [utils]
  )

  // Get explicit skills (user-added)
  const explicitSkills = userSkillsData?.explicitSkills || []

  // Get existing skill IDs for highlighting in modal
  const existingSkillIds = explicitSkills.map((skill: UserSkill) => skill.skill_id)

  // Handle skill selection from modal
  const handleSelectSkill = useCallback(
    async (skillId: string, proficiency: number) => {
      await addSkillMutation.mutateAsync({
        skillId,
        proficiency,
      })
    },
    [addSkillMutation]
  )

  // Handle skill update from modal
  const handleUpdateSkill = useCallback(
    async (skillId: string, proficiency: number) => {
      await updateSkillMutation.mutateAsync({
        skillId,
        proficiency,
      })
    },
    [updateSkillMutation]
  )

  // Handle remove skill
  const handleRemoveSkill = useCallback(
    async (skillId: string) => {
      await removeSkillMutation.mutateAsync({ skillId })
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
                    {industriesData?.industries.map((industry, index) => (
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

              {explicitSkills.length === 0 && selectedIndustry && (
                <YStack p="$4" items="center" gap="$2">
                  <Text color="$color11">No skills added yet</Text>
                </YStack>
              )}

              {explicitSkills.map((skill: UserSkill) => (
                <Card key={skill.skill_id} bordered size="$4">
                  <Card.Header gap="$2">
                    {/* Hierarchy Breadcrumb */}
                    <XStack gap="$1" items="center" flexWrap="wrap" flex={1}>
                      {skill.hierarchy_path.split(' > ').map((part, index, arr) => (
                        <XStack key={`${skill.skill_id}-${index}`} items="center" gap="$1">
                          <Text
                            fontSize={index === arr.length - 1 ? '$3' : '$2'}
                            color={index === arr.length - 1 ? '$color12' : '$color11'}
                            fontWeight={index === arr.length - 1 ? '600' : '400'}
                          >
                            {part}
                          </Text>
                          {index < arr.length - 1 && <ChevronRight size={12} color="$color11" />}
                        </XStack>
                      ))}
                    </XStack>

                    {/* CSI Code if available */}
                    {skill.csi_display && (
                      <Text fontSize="$2" color="$color10">
                        CSI {skill.csi_display}
                      </Text>
                    )}

                    {/* Proficiency */}
                    <XStack justify="space-between" items="center" pt="$2">
                      <YStack gap="$1">
                        <Text fontSize="$2" color="$color11">
                          Proficiency
                        </Text>
                        <Text fontWeight="600" fontSize="$3">
                          {skill.proficiency &&
                            PROFICIENCY_LABELS[
                              skill.proficiency as keyof typeof PROFICIENCY_LABELS
                            ]}{' '}
                          ({skill.proficiency}/5)
                        </Text>
                      </YStack>

                      <XStack gap="$2">
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={X}
                          onPress={() => handleRemoveSkill(skill.skill_id)}
                          disabled={removeSkillMutation.isPending}
                        >
                          Remove
                        </Button>
                      </XStack>
                    </XStack>
                  </Card.Header>
                </Card>
              ))}
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
