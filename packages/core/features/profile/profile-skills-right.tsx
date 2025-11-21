import { api } from '@app/core/utils/api'
import { ConfirmationDialog, DashboardWidget } from '@app/ui'
import { Award } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { TRPCClientError } from '@trpc/client'
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { ProfileResultCard, ProfileResultsPanel } from './components'
import { SkillCompletionProgress } from './components/skills/SkillCompletionProgress'
import { SkillGuidanceWidget } from './components/skills/SkillGuidanceWidget'
import { getProficiencyLabel } from './constants/proficiency-levels'
import { useProfileSkillsContext } from './profile-skills-context'

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
  // Track newly added skill for highlight animation
  const [newSkillId, setNewSkillId] = useState<string | null>(null)
  const previousSkillsRef = useRef<string[]>([])

  // Fetch user's skills
  const { data: userSkillsData, isLoading: isLoadingSkills } =
    api.profile.skillsMultiTaxonomy.getUserSkills.useQuery()

  // React Query utils for cache invalidation
  const utils = api.useUtils()

  // Remove skill mutation
  const removeSkillMutation = api.profile.skillsMultiTaxonomy.removeSkill.useMutation({
    onSuccess: async () => {
      // Invalidate cache to trigger automatic refetch
      await Promise.all([utils.profile.skillsMultiTaxonomy.getUserSkills.invalidate()])
      // Clear removing state after cache invalidation
      setRemovingSkillId(null)
      toast.show('Skill Removed', {
        message: 'Skill removed from your profile',
      })
    },
    onError: (error: unknown) => {
      // Fade skill back in by clearing removing state
      // This triggers the fade-in animation (opacity 0 → 1, height 0 → auto)
      setRemovingSkillId(null)

      // Determine error message based on error type
      // Match REQ-28 requirements for specific error messages
      let errorMessage = 'Something went wrong. Please try again.'

      // Check if error is TRPCClientError
      if (error instanceof TRPCClientError) {
        // Network errors (connection issues, fetch failures)
        if (
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('NetworkError')
        ) {
          errorMessage = 'Unable to remove skill. Check your connection and try again.'
        }
        // Server errors (5xx, internal server errors)
        else if (
          error.data?.code === 'INTERNAL_SERVER_ERROR' ||
          error.data?.code === 'BAD_REQUEST' ||
          (typeof error.data?.httpStatus === 'number' && error.data.httpStatus >= 500)
        ) {
          errorMessage = 'Failed to remove skill. Please try again.'
        } else {
          errorMessage = error.message || errorMessage
        }
      } else if (error instanceof Error) {
        // Handle generic Error objects
        if (
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('Failed to fetch')
        ) {
          errorMessage = 'Unable to remove skill. Check your connection and try again.'
        } else {
          errorMessage = error.message || errorMessage
        }
      }

      toast.show('Error', {
        message: errorMessage,
      })
    },
  })

  // Handle remove skill - opens confirmation modal
  const handleRemoveSkill = useCallback((userSkillId: string) => {
    setConfirmRemoveSkillId(userSkillId)
  }, [])

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

  // Detect newly added skills for highlight animation
  useEffect(() => {
    const currentSkillIds = userSkills.map((skill: { id: string }) => skill.id)
    const previousSkillIds = previousSkillsRef.current

    // Find skills that are new (in current but not in previous)
    const newSkills = currentSkillIds.filter((id: string) => !previousSkillIds.includes(id))

    if (newSkills.length > 0) {
      // Highlight the most recently added skill (first in array if sorted by created_at)
      const latestNewSkill = newSkills[0]
      setNewSkillId(latestNewSkill)

      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setNewSkillId(null)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Update ref for next comparison
    previousSkillsRef.current = currentSkillIds
  }, [userSkills])

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
          <SkillCompletionProgress
            skillCount={skillCount}
            hasMinimumSkills={hasMinimumSkills}
            completionPercent={completionPercent}
          />

          <SkillGuidanceWidget
            industryDisplayName={industryDisplayName}
            skillGuidance={skillGuidance}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </YStack>
      </DashboardWidget>

      <ProfileResultsPanel
        title="Your Skills"
        isLoading={isLoadingSkills}
        isEmpty={userSkills.length === 0}
        emptyIcon={Award as ComponentType<{ size?: number; color?: string }>}
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
                  isLoading={removingSkillId === skill.id || removeSkillMutation.isPending}
                  isNew={newSkillId === skill.id}
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
                            getProficiencyLabel(skill.proficiency_level)}{' '}
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
