import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import {
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
  UIButton,
} from '@scaffald/tamagui-ui'
import { CheckCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Text, XStack, YStack } from 'tamagui'
import { getProficiencyLabel } from '../constants/proficiency-levels'
import type { ProfileWidgetProps } from './types'

// EnrichedUserSkill type from skill-enrichment.ts
interface EnrichedUserSkill {
  id: string
  taxonomy: 'csi' | 'onet'
  name: string
  label: string
  displayCode: string | null
  proficiency: number
  yearsExperience: number | null
  verified: boolean
  metadata: Record<string, unknown> | null
}

/**
 * TechnicalSkillsWidget
 * Displays user's technical skills grouped by taxonomy
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function TechnicalSkillsWidget({ userId, showEdit = false, variant = 'full' }: ProfileWidgetProps) {
  const router = useRouter()

  // Fetch technical skills
  const { data, isLoading, error, refetch, isFetching } = api.profile.widgets.getSkills.useQuery(
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
          <UIButton
            variant="primary"
            size="$2"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </UIButton>
        </YStack>
      </DashboardWidget>
    )
  }

  const skills = (data || []) as EnrichedUserSkill[]
  const showCompact = variant === 'compact'

  // Group skills by taxonomy
  const groupedSkills = skills.reduce((acc: Record<string, EnrichedUserSkill[]>, skill: EnrichedUserSkill) => {
    const taxonomy = skill.taxonomy || 'Other'
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

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Technical Skills</Heading>
          {showEdit && (
            <UIButton
              variant="outlined"
              size="$2"
              onPress={() => {
                router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
              }}
            >
              Edit
            </UIButton>
          )}
        </XStack>

        {/* Skills Content */}
        {skills.length === 0 ? (
          <EmptyState
            title="No skills added yet"
            description="Add your skills to showcase your expertise"
            action={
              showEdit ? (
                <UIButton
                  variant="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                >
                  Add Skills
                </UIButton>
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
                    .map((skill: EnrichedUserSkill) => (
                      <XStack
                        key={skill.id}
                        bg="$blue2"
                        px="$3"
                        py="$2"
                        rounded="$3"
                        borderWidth={1}
                        borderColor={skill.verified ? '$blue7' : '$blue5'}
                        gap="$2"
                        items="center"
                      >
                        {skill.verified && <CheckCircle size={14} color="$blue11" />}
                        <YStack gap="$0.5">
                          <Text fontSize="$2" fontWeight="500" color="$blue11">
                            {skill.name}
                          </Text>
                          {!showCompact && (
                            <XStack gap="$2">
                              {skill.proficiency > 0 && (
                                <Text fontSize="$1" color="$blue10">
                                  {getProficiencyLabel(skill.proficiency)}
                                </Text>
                              )}
                              {skill.yearsExperience !== null && skill.yearsExperience > 0 && (
                                <Text fontSize="$1" color="$blue10">
                                  • {skill.yearsExperience}y
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
                color="$blue7"
                fontSize="$3"
                fontWeight="600"
                cursor="pointer"
                hoverStyle={{ color: '$blue8' }}
                pressStyle={{ color: '$blue9' }}
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
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

