import { YStack, XStack, Text, Spinner } from 'tamagui'
import { DashboardWidget, Button } from '@app/ui'
import { Heading } from '@app/ui/components/typography/Heading'
import { LoadingState } from '@app/ui/components/states/LoadingState'
import { EmptyState } from '@app/ui/components/states/EmptyState'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { spacing } from '@/tokens/design-tokens'
import { CheckCircle } from '@tamagui/lucide-icons'
import type { ProfileWidgetProps } from './types'

interface UserSkill {
  id: string
  skill_taxonomy: string
  metadata: Record<string, unknown> | null
  proficiency_level: number | null
  years_experience: number | null
  notes: string | null
  verified: boolean | null
}

/**
 * SkillsWidget
 * Displays user's skills grouped by taxonomy
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function SkillsWidget({ userId, showEdit = false, variant = 'full' }: ProfileWidgetProps) {
  const router = useRouter()
  const { data, isLoading, error } = api.profile.widgets.getSkills.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading skills..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  const skills = data || []
  const showCompact = variant === 'compact'

  // Group skills by taxonomy
  const groupedSkills = skills.reduce((acc: Record<string, UserSkill[]>, skill: UserSkill) => {
    const taxonomy = skill.skill_taxonomy || 'Other'
    if (!acc[taxonomy]) {
      acc[taxonomy] = []
    }
    acc[taxonomy].push(skill)
    return acc
  }, {})

  const taxonomyOrder = ['onet', 'csi', 'Other']
  const sortedTaxonomies = Object.keys(groupedSkills).sort((a, b) => {
    const aIndex = taxonomyOrder.indexOf(a)
    const bIndex = taxonomyOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  // Helper to get skill display name from metadata
  const getSkillName = (skill: UserSkill): string => {
    if (skill.metadata && typeof skill.metadata === 'object') {
      const name = skill.metadata.name
      const title = skill.metadata.title
      if (typeof name === 'string') return name
      if (typeof title === 'string') return title
    }
    return 'Unnamed Skill'
  }

  // Helper to get proficiency label
  const getProficiencyLabel = (level: number | null): string => {
    if (level === null) return ''
    if (level >= 4) return 'Expert'
    if (level >= 3) return 'Advanced'
    if (level >= 2) return 'Intermediate'
    return 'Beginner'
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Skills</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="small"
              onPress={() => router.push('/dashboard/profile/skills')}
            >
              Edit
            </Button>
          )}
        </XStack>

        {skills.length === 0 ? (
          <EmptyState
            title="No skills added yet"
            description="Add your skills to showcase your expertise"
            action={
              showEdit ? (
                <Button variant="primary" onPress={() => router.push('/dashboard/profile/skills')}>
                  Add Skills
                </Button>
              ) : undefined
            }
          />
        ) : (
          <YStack gap="$4">
            {sortedTaxonomies.slice(0, showCompact ? 1 : undefined).map((taxonomy) => (
              <YStack key={taxonomy} gap="$2">
                {/* Taxonomy Header */}
                <Text fontSize="$3" fontWeight="600" color="$color11" textTransform="uppercase">
                  {taxonomy === 'onet' ? 'O*NET' : taxonomy === 'csi' ? 'CSI' : taxonomy}
                </Text>

                {/* Skills in this taxonomy */}
                <XStack gap="$2" flexWrap="wrap">
                  {groupedSkills[taxonomy]
                    .slice(0, showCompact ? 5 : undefined)
                    .map((skill: UserSkill) => (
                      <XStack
                        key={skill.id}
                        bg="$teal2"
                        px="$3"
                        py="$2"
                        rounded="$3"
                        borderWidth={1}
                        borderColor={skill.verified ? '$teal7' : '$teal5'}
                        gap="$2"
                        items="center"
                      >
                        {skill.verified && <CheckCircle size={14} color="$teal11" />}
                        <YStack gap="$0.5">
                          <Text fontSize="$2" fontWeight="500" color="$teal11">
                            {getSkillName(skill)}
                          </Text>
                          {!showCompact && (
                            <XStack gap="$2">
                              {skill.proficiency_level !== null && (
                                <Text fontSize="$1" color="$teal10">
                                  {getProficiencyLabel(skill.proficiency_level)}
                                </Text>
                              )}
                              {skill.years_experience !== null && skill.years_experience > 0 && (
                                <Text fontSize="$1" color="$teal10">
                                  • {skill.years_experience}y
                                </Text>
                              )}
                            </XStack>
                          )}
                        </YStack>
                      </XStack>
                    ))}
                </XStack>
              </YStack>
            ))}

            {/* Show More link for compact view */}
            {showCompact && skills.length > 5 && (
              <Text
                color="$teal7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$teal8' }}
                pressStyle={{ color: '$teal9' }}
                onPress={() => router.push('/dashboard/profile/skills')}
              >
                View all {skills.length} skills →
              </Text>
            )}
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
