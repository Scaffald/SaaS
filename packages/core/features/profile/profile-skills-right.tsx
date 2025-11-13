import { useCallback, useState } from 'react'
import { YStack, XStack, Text, Button, Progress } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { Award, Sparkles } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { ProfileResultsPanel, ProfileResultCard } from './components'
import { DashboardWidget, ConfirmationDialog } from '@app/ui'
import { useProfileSkillsContext } from './profile-skills-context'

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
 * Profile Skills Right Component
 * Display user's saved skills with remove capability
 */
export function ProfileSkillsRight() {
  const toast = useToastController()
  const {
    industryDisplayName,
    skillGuidance,
    hasMinimumSkills,
    skillCount,
    completionPercent,
    handleSuggestionSelect,
  } = useProfileSkillsContext()

  // Confirmation modal state
  const [confirmRemoveSkillId, setConfirmRemoveSkillId] = useState<string | null>(null)
  // Animation state for skill removal
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null)

  // Fetch user's skills
  const {
    data: userSkillsData,
    isLoading: isLoadingSkills,
  } = api.profile.skillsMultiTaxonomy.getUserSkills.useQuery()

  // React Query utils for cache invalidation
  const utils = api.useUtils()

  // Remove skill mutation
  const removeSkillMutation = api.profile.skillsMultiTaxonomy.removeSkill.useMutation({
    onSuccess: async () => {
      // Invalidate cache to trigger automatic refetch
      await Promise.all([
        utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate(),
      ])
      // Clear removing state after cache invalidation
      setRemovingSkillId(null)
      toast.show('Skill Removed', {
        message: 'Skill removed from your profile',
      })
    },
    // biome-ignore lint/suspicious/noExplicitAny: tRPC error type
    onError: (error: any) => {
      // Fade skill back in by clearing removing state
      setRemovingSkillId(null)

      // Determine error message based on error type
      let errorMessage = 'Something went wrong. Please try again.'

      if (
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('Failed to fetch')
      ) {
        errorMessage =
          'Unable to remove skill. Check your connection and try again.'
      } else if (error.data?.code === 'INTERNAL_SERVER_ERROR') {
        errorMessage = 'Failed to remove skill. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.show('Error', {
        message: errorMessage,
      })
    },
  })

  // Handle remove skill - opens confirmation modal
  const handleRemoveSkill = useCallback(
    (userSkillId: string) => {
      setConfirmRemoveSkillId(userSkillId)
    },
    []
  )

  // Handle confirmed removal
  const handleConfirmRemove = useCallback(async () => {
    if (!confirmRemoveSkillId) return

    // Prevent concurrent removals
    if (removingSkillId !== null) {
      toast.show('Please Wait', {
        message: 'Please wait for the current removal to complete',
      })
      setConfirmRemoveSkillId(null)
      return
    }

    const skillIdToRemove = confirmRemoveSkillId

    // Start fade-out animation
    setRemovingSkillId(skillIdToRemove)
    setConfirmRemoveSkillId(null)

    // Wait for animation to complete (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Execute removal mutation
    await removeSkillMutation.mutateAsync({ userSkillId: skillIdToRemove })
  }, [confirmRemoveSkillId, removingSkillId, removeSkillMutation, toast])

  const userSkills = userSkillsData?.skills || []

  // Find skill name for confirmation modal
  const skillToRemove = userSkills.find(
    (skill: {
      id: string
      skill_details: {
        name: string
        display_code: string
        hierarchy_level: number | null
      } | null
      proficiency_level: number | null
    }) => skill.id === confirmRemoveSkillId
  )
  const skillName = skillToRemove?.skill_details?.name || 'this skill'

  return (
    <YStack gap="$4" flex={1}>
      <ConfirmationDialog
        open={confirmRemoveSkillId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmRemoveSkillId(null)
          }
        }}
        title="Remove Skill?"
        message={`Are you sure you want to remove "${skillName}" from your profile?`}
        confirmLabel="Remove Skill"
        cancelLabel="Cancel"
        confirmTheme="red"
        onConfirm={handleConfirmRemove}
        isLoading={removeSkillMutation.isPending}
      />
      <DashboardWidget>
        <YStack gap="$3">
          <YStack
            p="$4"
            gap="$3"
            bg="$blue2"
            borderWidth={1}
            borderColor="$blue5"
            rounded="$4"
          >
            <XStack gap="$3" items="center">
              <Sparkles size={20} color="$blue10" />
              <YStack gap="$1" flex={1}>
                <Text fontWeight="600" color="$blue11">
                  {hasMinimumSkills
                    ? `Great! You've added ${skillCount} skill${skillCount === 1 ? '' : 's'}.`
                    : 'Experts recommend adding at least 5 skills to your profile.'}
                </Text>
                <Text fontSize="$2" color="$blue11">
                  Add role-specific, safety, and leadership skills to improve your match rate.
                </Text>
              </YStack>
            </XStack>

            <YStack gap="$2">
              <XStack justify="space-between" items="center">
                <Text fontSize="$2" color="$blue11">
                  Skill section completeness
                </Text>
                <Text fontSize="$2" fontWeight="600" color="$blue11">
                  {completionPercent}%
                </Text>
              </XStack>
              <Progress value={completionPercent} max={100} bg="$blue3" size="$2">
                <Progress.Indicator
                  bg={completionPercent >= 100 ? '$green10' : '$blue9'}
                />
              </Progress>
            </YStack>
          </YStack>

          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontWeight="600">Commonly added skills in {industryDisplayName}:</Text>
              <XStack gap="$2" flexWrap="wrap">
                {skillGuidance.recommended.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    size="$2"
                    variant="outlined"
                    borderColor="$blue6"
                    bg="$blue1"
                    onPress={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Users in {industryDisplayName} often add:</Text>
              <XStack gap="$2" flexWrap="wrap">
                {skillGuidance.examples.map((suggestion) => (
                  <Button
                    key={suggestion.label}
                    size="$2"
                    variant="outlined"
                    bg="$color2"
                    onPress={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion.label}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack gap="$1">
              {skillGuidance.tips.map((tip) => (
                <Text key={tip} fontSize="$2" color="$color11">
                  • {tip}
                </Text>
              ))}
            </YStack>
          </YStack>
        </YStack>
      </DashboardWidget>

      <ProfileResultsPanel
        title="Your Skills"
        isLoading={isLoadingSkills}
        isEmpty={userSkills.length === 0}
        emptyIcon={Award as React.ComponentType<{ size?: number; color?: string }>}
        emptyMessage="No skills added yet. Use the form on the left to add your first skill."
      >
        <YStack gap="$3">
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
              <YStack
                key={skill.id}
                animation="quick"
                opacity={removingSkillId === skill.id ? 0 : 1}
                height={removingSkillId === skill.id ? 0 : 'auto'}
                overflow="hidden"
              >
                <ProfileResultCard
                  onRemove={() => handleRemoveSkill(skill.id)}
                  removeDisabled={removeSkillMutation.isPending || removingSkillId === skill.id}
                  isRemoving={removingSkillId === skill.id}
                >
                  {/* Skill Name and Code */}
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="600">
                      {skill.skill_details?.name || 'Unknown Skill'}
                    </Text>
                    {skill.skill_details?.display_code && (
                      <Text fontSize="$2" color="$color10">
                        Code: {skill.skill_details.display_code}
                      </Text>
                    )}

                    {/* Proficiency Level */}
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
                    </XStack>
                  </YStack>
                </ProfileResultCard>
              </YStack>
            )
          )}
        </YStack>
      </ProfileResultsPanel>
    </YStack>
  )
}
