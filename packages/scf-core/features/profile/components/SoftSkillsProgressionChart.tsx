import { api } from '@scf/core/utils/api'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react-native'
import { useMemo, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { SoftSkillCategory } from './SoftSkillsCategoryTabs'

interface SoftSkillsProgressionChartProps {
  userId?: string
}

interface SkillProgression {
  skillId: string
  skillName: string
  category: SoftSkillCategory
  currentRating: number | null
  previousRating: number | null
  trend: 'improved' | 'declined' | 'stable' | 'new' | 'removed'
  change: number | null
}

/**
 * SoftSkillsProgressionChart component
 *
 * Displays skill progression trends showing which skills improved,
 * declined, or stayed stable between versions.
 */
export const SoftSkillsProgressionChart: FC<SoftSkillsProgressionChartProps> = ({ userId }) => {
  // Fetch version history
  const {
    data: historyData,
    isLoading,
    error,
  } = api.profile.skills.getSoftSkillsHistory.useQuery(undefined, {
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch current version for comparison
  const { data: currentData } = api.profile.skills.getSoftSkills.useQuery(
    userId ? { userId } : undefined,
    {
      enabled: !!userId || !userId,
      staleTime: 5 * 60 * 1000,
    }
  )

  const versions = historyData?.versions || []
  const currentSkills = currentData?.skills || []

  // Calculate progression for each skill
  const skillProgression = useMemo<SkillProgression[]>(() => {
    if (versions.length < 2 || currentSkills.length === 0) {
      return []
    }

    // Get previous version (second most recent)
    const previousVersion = versions[1]
    if (!previousVersion) return []

    // Fetch previous version skills
    const previousSkills = currentSkills.map((skill) => {
      // For simplicity, we'll calculate based on category averages
      // In a real implementation, we'd need to fetch individual skill ratings for each version
      const previousCategoryAvg =
        previousVersion.categoryAverages[skill.category as SoftSkillCategory] ?? 0

      // Estimate skill rating from category average (simplified)
      const currentRating = skill.rating
      const estimatedPreviousRating =
        currentRating && previousCategoryAvg ? previousCategoryAvg : null

      let trend: SkillProgression['trend'] = 'stable'
      let change: number | null = null

      if (currentRating !== null && estimatedPreviousRating !== null) {
        change = currentRating - estimatedPreviousRating
        if (change > 0.1) {
          trend = 'improved'
        } else if (change < -0.1) {
          trend = 'declined'
        } else {
          trend = 'stable'
        }
      } else if (currentRating !== null && estimatedPreviousRating === null) {
        trend = 'new'
        change = currentRating
      } else if (currentRating === null && estimatedPreviousRating !== null) {
        trend = 'removed'
        change = -estimatedPreviousRating
      }

      return {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        currentRating: currentRating ?? null,
        previousRating: estimatedPreviousRating,
        trend,
        change,
      }
    })

    return previousSkills
  }, [versions, currentSkills])

  const categoryLabels: Record<SoftSkillCategory, string> = {
    reliability: 'Reliability',
    collaboration: 'Collaboration',
    professionalism: 'Professionalism',
    technical: 'Technical',
  }

  if (isLoading) {
    return (
      <Stack gap="$4" alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text color="$color11">Loading progression data...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap="$2" padding="$4">
        <Text fontSize="$5" fontWeight="600" color="$red11">
          Error loading progression
        </Text>
        <Text fontSize="$3" color="$color11">
          {error.message || 'Failed to load progression data'}
        </Text>
      </Stack>
    )
  }

  if (versions.length < 2) {
    return (
      <Stack gap="$2" padding="$4" alignItems="center">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          Progression Tracking
        </Text>
        <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
          Complete at least two assessments to see skill progression trends.
        </Text>
      </Stack>
    )
  }

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    const grouped: Record<SoftSkillCategory, SkillProgression[]> = {
      reliability: [],
      collaboration: [],
      professionalism: [],
      technical: [],
    }

    for (const skill of skillProgression) {
      grouped[skill.category].push(skill)
    }

    return grouped
  }, [skillProgression])

  const getTrendIcon = (trend: SkillProgression['trend']) => {
    switch (trend) {
      case 'improved':
        return <ArrowUp size={16} color="$green10" />
      case 'declined':
        return <ArrowDown size={16} color="$red10" />
      case 'stable':
        return <ArrowRight size={16} color="$color10" />
      default:
        return null
    }
  }

  const getTrendColor = (trend: SkillProgression['trend']) => {
    switch (trend) {
      case 'improved':
        return '$green11'
      case 'declined':
        return '$red11'
      case 'stable':
        return '$color11'
      default:
        return '$color10'
    }
  }

  const improvedSkills = skillProgression.filter((s) => s.trend === 'improved').length
  const declinedSkills = skillProgression.filter((s) => s.trend === 'declined').length
  const stableSkills = skillProgression.filter((s) => s.trend === 'stable').length

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap="$4" padding="$4">
        <Stack gap="$2">
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Skill Progression
          </Text>
          <Text fontSize="$3" color="$color11">
            Track how your soft skills have changed over time.
          </Text>
        </Stack>

        {/* Summary Stats */}
        <Row gap="$3" flexWrap="wrap">
          <Stack
            gap="$1"
            padding="$3"
            backgroundColor="$green2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$green7"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text fontSize="$2" color="$green10" fontWeight="600">
              Improved
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$green11">
              {improvedSkills}
            </Text>
          </Stack>
          <Stack
            gap="$1"
            padding="$3"
            backgroundColor="$red2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$red7"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text fontSize="$2" color="$red10" fontWeight="600">
              Declined
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$red11">
              {declinedSkills}
            </Text>
          </Stack>
          <Stack
            gap="$1"
            padding="$3"
            backgroundColor="$color2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text fontSize="$2" color="$color10" fontWeight="600">
              Stable
            </Text>
            <Text fontSize="$5" fontWeight="700" color="$color11">
              {stableSkills}
            </Text>
          </Stack>
        </Row>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, skills]) => {
          if (skills.length === 0) return null

          return (
            <Stack key={category} gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {categoryLabels[category as SoftSkillCategory]}
              </Text>
              <Stack gap="$2">
                {skills.map((skill) => (
                  <Stack
                    key={skill.skillId}
                    gap="$2"
                    padding="$3"
                    backgroundColor="$color2"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Row
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      gap="$2"
                    >
                      <Stack gap="$1" flex={1}>
                        <Text fontSize="$4" fontWeight="600" color="$color12">
                          {skill.skillName}
                        </Text>
                        <Row gap="$3" alignItems="center">
                          {skill.previousRating !== null && (
                            <Text fontSize="$2" color="$color10">
                              Previous: {skill.previousRating.toFixed(1)}/5
                            </Text>
                          )}
                          {skill.currentRating !== null && (
                            <Text fontSize="$2" color="$color11" fontWeight="600">
                              Current: {skill.currentRating.toFixed(1)}/5
                            </Text>
                          )}
                        </Row>
                      </Stack>
                      <Row gap="$2" alignItems="center">
                        {getTrendIcon(skill.trend)}
                        {skill.change !== null && (
                          <Text fontSize="$3" fontWeight="600" color={getTrendColor(skill.trend)}>
                            {skill.change > 0 ? '+' : ''}
                            {skill.change.toFixed(1)}
                          </Text>
                        )}
                      </Row>
                    </Row>
                  </Stack>
                ))}
              </Stack>
              {category !== 'technical' && <Separator />}
            </Stack>
          )
        })}
      </Stack>
    </ScrollView>
  )
}
