import { useSoftSkillsHistory, useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react-native'
import { useMemo, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
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
    isPending: isLoading,
    error,
  } = useSoftSkillsHistory({
    enabled: true,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch current version for comparison
  const { data: currentData } = useSoftSkills(userId ? { userId } : undefined, {
    enabled: !!userId || !userId,
    staleTime: 5 * 60 * 1000,
  })

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
      <Stack gap={16} align="center" justify="center" padding="md">
        <Spinner size="lg" color="$blue10" />
        <Text color="$gray11">Loading progression data...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={8} padding="md">
        <Text color="$red11">Error loading progression</Text>
        <Text color="$gray11">{error.message || 'Failed to load progression data'}</Text>
      </Stack>
    )
  }

  if (versions.length < 2) {
    return (
      <Stack gap={8} padding="md" align="center">
        <Text color="$gray11">Progression Tracking</Text>
        <Text color="$gray11" style={{ textAlign: 'center' }}>
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
        return <ArrowUp size="md" color="$green10" />
      case 'declined':
        return <ArrowDown size="md" color="$red10" />
      case 'stable':
        return <ArrowRight size="md" color="$gray11" />
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
      <Stack gap={16} padding="md">
        <Stack gap={8}>
          <Text color="$gray11">Skill Progression</Text>
          <Text color="$gray11">Track how your soft skills have changed over time.</Text>
        </Stack>

        {/* Summary Stats */}
        <Row gap={12} wrap>
          <Stack
            gap={4}
            padding="sm"
            backgroundColor="$green2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$green7"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text color="$green10">Improved</Text>
            <Text color="$green11">{improvedSkills}</Text>
          </Stack>
          <Stack
            gap={4}
            padding="sm"
            backgroundColor="$red2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$red7"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text color="$red10">Declined</Text>
            <Text color="$red11">{declinedSkills}</Text>
          </Stack>
          <Stack
            gap={4}
            padding="sm"
            backgroundColor="$color2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderColor"
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text color="$gray11">Stable</Text>
            <Text color="$gray11">{stableSkills}</Text>
          </Stack>
        </Row>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, skills]) => {
          if (skills.length === 0) return null

          return (
            <Stack key={category} gap={12}>
              <Text color="$gray11">{categoryLabels[category as SoftSkillCategory]}</Text>
              <Stack gap={8}>
                {skills.map((skill) => (
                  <Stack
                    key={skill.skillId}
                    gap={8}
                    padding="sm"
                    backgroundColor="$color2"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Row align="center" justify="space-between" wrap gap={8}>
                      <Stack gap={4} flex={1}>
                        <Text color="$gray11">{skill.skillName}</Text>
                        <Row gap={12} align="center">
                          {skill.previousRating !== null && (
                            <Text color="$gray11">
                              Previous: {skill.previousRating.toFixed(1)}/5
                            </Text>
                          )}
                          {skill.currentRating !== null && (
                            <Text color="$gray11">Current: {skill.currentRating.toFixed(1)}/5</Text>
                          )}
                        </Row>
                      </Stack>
                      <Row gap={8} align="center">
                        {getTrendIcon(skill.trend)}
                        {skill.change !== null && (
                          <Text color={getTrendColor(skill.trend)}>
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
