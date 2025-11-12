import { useCallback } from 'react'
import { YStack, XStack, Text, Button, Progress } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { Award, Sparkles } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { ProfileResultsPanel, ProfileResultCard } from './components'
import { DashboardWidget } from '@app/ui'
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

  // Fetch user's skills
  const {
    data: userSkillsData,
    isLoading: isLoadingSkills,
    refetch: refetchSkills,
  } = api.profile.skillsMultiTaxonomy.getUserSkills.useQuery()

  // Remove skill mutation
  const removeSkillMutation = api.profile.skillsMultiTaxonomy.removeSkill.useMutation({
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
    <YStack gap="$4" flex={1}>
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
    </YStack>
  )
}
