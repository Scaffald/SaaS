import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  spacing,
} from '@unicornlove/beyond-ui'
import { CheckCircle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
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
export function TechnicalSkillsWidget({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
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
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <Button
            variant="primary"
            size="$2"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const skills = (data || []) as EnrichedUserSkill[]
  const showCompact = variant === 'compact'

  // Group skills by taxonomy
  const groupedSkills = skills.reduce(
    (acc: Record<string, EnrichedUserSkill[]>, skill: EnrichedUserSkill) => {
      const taxonomy = skill.taxonomy || 'Other'
      if (!acc[taxonomy]) {
        acc[taxonomy] = []
      }
      acc[taxonomy].push(skill)
      return acc
    },
    {}
  )

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
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Technical Skills</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="$2"
              onPress={() => {
                router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
              }}
            >
              Edit
            </Button>
          )}
        </Row>

        {/* Skills Content */}
        {skills.length === 0 ? (
          <EmptyState
            title="No skills added yet"
            description="Add your skills to showcase your expertise"
            action={
              showEdit ? (
                <Button
                  variant="primary"
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                >
                  Add Skills
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack gap="$4">
            {sortedTaxonomies.slice(0, showCompact ? 1 : undefined).map((taxonomy) => (
              <Stack key={taxonomy} gap="$2">
                {/* Taxonomy Header */}
                <Text fontSize="$3" fontWeight="600" color="$color11" textTransform="uppercase">
                  {taxonomy === 'onet' ? 'O*NET' : taxonomy === 'csi' ? 'CSI' : taxonomy}
                </Text>

                {/* Skills in this taxonomy */}
                <Row gap="$2" flexWrap="wrap">
                  {groupedSkills[taxonomy]
                    .slice(0, showCompact ? 5 : undefined)
                    .map((skill: EnrichedUserSkill) => (
                      <Row
                        key={skill.id}
                        backgroundColor="$blue2"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                        borderWidth={1}
                        borderColor={skill.verified ? '$blue7' : '$blue5'}
                        gap="$2"
                        alignItems="center"
                      >
                        {skill.verified && <CheckCircle size={14} color="$blue11" />}
                        <Stack gap="$0.5">
                          <Text fontSize="$2" fontWeight="500" color="$blue11">
                            {skill.name}
                          </Text>
                          {!showCompact && (
                            <Row gap="$2">
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
                            </Row>
                          )}
                        </Stack>
                      </Row>
                    ))}
                </Row>
              </Stack>
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
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
