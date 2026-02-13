import { useSoftSkillsHistory, useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react-native'
import { useMemo, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
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
export const SoftSkillsProgressionChart: FC<SoftSkillsProgressionChartProps> = () => {
  const { theme } = useThemeContext()userId ) => {
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
        <Spinner size="lg" style={{ color: colors.text[theme].info }} />
        <Text style={{ color: colors.text[theme].secondary }}>Loading progression data...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={8} padding="md">
        <Text style={{ color: colors.text[theme].error }}>Error loading progression</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{error.message || 'Failed to load progression data'}</Text>
      </Stack>
    )
  }

  if (versions.length < 2) {
    return (
      <Stack gap={8} padding="md" align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Progression Tracking</Text>
        <Text style={{ color: colors.text[theme].secondary }} style={{ textAlign: 'center' }}>
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
        return <ArrowUp size="md" style={{ color: colors.text[theme].success }} />
      case 'declined':
        return <ArrowDown size="md" style={{ color: colors.text[theme].error }} />
      case 'stable':
        return <ArrowRight size="md" style={{ color: colors.text[theme].secondary }} />
      default:
        return null
    }
  }

  const getTrendColor = (trend: SkillProgression['trend']) => {
    switch (trend) {
      case 'improved':
        return colors.text[theme].success
      case 'declined':
        return colors.text[theme].error
      case 'stable':
        return colors.text[theme].secondary
      default:
        return colors.text[theme].tertiary
    }
  }

  const improvedSkills = skillProgression.filter((s) => s.trend === 'improved').length
  const declinedSkills = skillProgression.filter((s) => s.trend === 'declined').length
  const stableSkills = skillProgression.filter((s) => s.trend === 'stable').length

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>Skill Progression</Text>
          <Text style={{ color: colors.text[theme].secondary }}>Track how your soft skills have changed over time.</Text>
        </Stack>

        {/* Summary Stats */}
        <Row gap={12} flexWrap="wrap">
          <Stack
            gap={4}
            padding="sm"
            style={{ backgroundColor: colors.bg[theme].success }}
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].success }}
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text style={{ color: colors.text[theme].success }}>Improved</Text>
            <Text style={{ color: colors.text[theme].success }}>{improvedSkills}</Text>
          </Stack>
          <Stack
            gap={4}
            padding="sm"
            backgroundColor="$red2"
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].error }}
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text style={{ color: colors.text[theme].error }}>Declined</Text>
            <Text style={{ color: colors.text[theme].error }}>{declinedSkills}</Text>
          </Stack>
          <Stack
            gap={4}
            padding="sm"
            style={{ backgroundColor: colors.bg[theme].subtle }}
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].default }}
            style={{ flex: 1, minWidth: 100 }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>Stable</Text>
            <Text style={{ color: colors.text[theme].secondary }}>{stableSkills}</Text>
          </Stack>
        </Row>

        {/* Skills by Category */}
        {Object.entries(skillsByCategory).map(([category, skills]) => {
          if (skills.length === 0) return null

          return (
            <Stack key={category} gap={12}>
              <Text style={{ color: colors.text[theme].secondary }}>{categoryLabels[category as SoftSkillCategory]}</Text>
              <Stack gap={8}>
                {skills.map((skill) => (
                  <Stack
                    key={skill.skillId}
                    gap={8}
                    padding="sm"
                    style={{ backgroundColor: colors.bg[theme].subtle }}
                    borderRadius={12}
                    borderWidth={1}
                    style={{ borderColor: colors.border[theme].default }}
                  >
                    <Row align="center" justify="space-between" flexWrap="wrap" gap={8}>
                      <Stack gap={4} flex={1}>
                        <Text style={{ color: colors.text[theme].secondary }}>{skill.skillName}</Text>
                        <Row gap={12} align="center">
                          {skill.previousRating !== null && (
                            <Text style={{ color: colors.text[theme].secondary }}>Previous: {skill.previousRating.toFixed(1)}/5</Text>
                          )}
                          {skill.currentRating !== null && (
                            <Text style={{ color: colors.text[theme].secondary }}>Current: {skill.currentRating.toFixed(1)}/5</Text>
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
