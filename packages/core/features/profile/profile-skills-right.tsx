import { useCallback } from 'react'
import { YStack, XStack, Text } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { Award } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { ProfileResultsPanel, ProfileResultCard } from './components'

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

  // Fetch user's skills
  const {
    data: userSkillsData,
    isLoading: isLoadingSkills,
    refetch: refetchSkills,
  } = api.profile.getUserSkills.useQuery()

  // Remove skill mutation
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

  // Handle remove skill
  const handleRemoveSkill = useCallback(
    async (userSkillId: string) => {
      await removeSkillMutation.mutateAsync({ userSkillId })
    },
    [removeSkillMutation]
  )

  const userSkills = userSkillsData?.skills || []

  return (
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
            <ProfileResultCard
              key={skill.id}
              onRemove={() => handleRemoveSkill(skill.id)}
              removeDisabled={removeSkillMutation.isPending}
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
          )
        )}
      </YStack>
    </ProfileResultsPanel>
  )
}
