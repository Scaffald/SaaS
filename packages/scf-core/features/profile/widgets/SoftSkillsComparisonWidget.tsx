import { ROUTES } from '@scf/core/constants/routes'
import { useSoftSkills, useSoftSkillsComparison } from '@scf/core/utils/profile-skills-sdk-hooks'
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  SkillsChart,
  spacing,
  type SkillsChartDataset,
} , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState, type FC } from 'react'
import { Separator, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import type { ProfileWidgetProps } from './types'

/**
 * SoftSkillsComparisonWidget component
 *
 * Displays soft skills analysis with category tabs and radar chart visualization.
 * Supports CTA button for incomplete assessments (dashboard use case).
 */
export const SoftSkillsComparisonWidget: FC<ProfileWidgetProps> = () => {
  const { theme } = useThemeContext()
{
  userId,
  showEdit = false,
  variant = 'full',
  showCTA = false,
}) => {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')

  // Fetch soft skills data
  // When userId is undefined, query for current user (API handles this)
  const {
    data,
    isPending: isLoading,
    error,
  } = useSoftSkills(userId ? { userId } : undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch peer comparison data
  const { data: comparisonData } = useSoftSkillsComparison({
    staleTime: 5 * 60 * 1000,
  })

  // Calculate completion status
  const { isCompleted, completionCount } = useMemo(() => {
    if (!data) {
      return { isCompleted: false, completionCount: 0 }
    }

    const ratedSkills = data.skills.filter(
      (skill) => skill.rating !== null && skill.rating !== undefined
    )
    const completed = ratedSkills.length === 25 // All 25 soft skills should be rated

    return {
      isCompleted: completed,
      completionCount: ratedSkills.length,
    }
  }, [data])

  // Prepare skills for display
  const skills = useMemo<SoftSkill[]>(() => {
    if (!data) return []

    return data.skills
      .filter((skill) => skill.rating !== null && skill.rating !== undefined)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        selfRating: skill.rating ?? 0,
        peerRating: undefined,
        versionHistory: undefined,
      }))
  }, [data])

  // Handle navigation to assessment
  const handleNavigateToAssessment = () => {
    router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
  }

  // Category labels for display
  const categoryLabels: Record<SoftSkillCategory, string> = {
    reliability: 'Reliability',
    collaboration: 'Collaboration',
    professionalism: 'Professionalism',
    technical: 'Technical',
  }

  // Calculate skills chart data for the active category (SkillsChart format)
  const categoryChartData = useMemo<SkillsChartDataset[] | null>(() => {
    if (!data || !skills || skills.length === 0) return null

    // Filter skills by active category
    const categorySkills = skills.filter((skill) => skill.category === activeCategory)

    if (categorySkills.length === 0) return null

    // Create skills chart dataset: each skill becomes a point
    // Convert 1-5 scale to 0-100 for better visualization
    const chartData = categorySkills.map((skill) => ({
      label: skill.name,
      value: Math.round(skill.selfRating * 20), // Convert 1-5 to 0-100 scale
    }))

    const datasets: SkillsChartDataset[] = [
      {
        label: categoryLabels[activeCategory],
        data: chartData,
        fillColor: colors.bg[theme].info,
        strokeColor: colors.bg[theme].primary,
        strokeWidth: 3,
        fillOpacity: 0.02,
        gradient: {
          startColor: colors.border[theme].info,
          endColor: colors.bg[theme].info,
        },
      },
    ]

    // Add peer comparison data if available for this category
    if (comparisonData?.peer) {
      const peerCategoryAvg = comparisonData.peer[activeCategory] ?? 0
      const categorySkillsCount = categorySkills.length

      if (categorySkillsCount > 0) {
        const peerChartData = categorySkills.map((skill) => ({
          label: skill.name,
          value: Math.round(peerCategoryAvg * 20), // Convert 1-5 to 0-100 scale
        }))

        datasets.push({
          label: 'Peer Average',
          data: peerChartData,
          fillColor: colors.bg[theme].success,
          strokeColor: colors.bg[theme].success,
          strokeWidth: 3,
          fillOpacity: 0.02,
        })
      }
    }

    return datasets
  }, [data, skills, activeCategory, comparisonData])

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading soft skills..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].error }}>Failed to load soft skills</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show empty state when no data or no skills
  if (!data || data.skills.length === 0) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md}>
          <Row justify="space-between" align="center">
            <Heading variant="h4">Soft Skills Analysis</Heading>
          </Row>
          <EmptyState
            title="No soft skills assessment"
            description="Complete your soft skills assessment to see your profile"
            iconStart={undefined}
          />
          {showCTA && (
            <Button variant="primary" onPress={handleNavigateToAssessment}>
              Complete Soft Skills Assessment
            </Button>
          )}
        </Stack>
      </DashboardWidget>
    )
  }

  // Show incomplete state with CTA when assessment is not complete
  if (!isCompleted && showCTA) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md}>
          <Row justify="space-between" align="center">
            <Heading variant="h4">Soft Skills Analysis</Heading>
          </Row>
          <Stack gap={16}>
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
                Complete your soft skills assessment to showcase your strengths and improve job
                matching.
              </Text>
              <Text style={{ color: colors.text[theme].secondary }}>{completionCount} of 25 skills rated</Text>
            </Stack>
            <Button variant="primary" onPress={handleNavigateToAssessment}>
              Complete Soft Skills Assessment
            </Button>
          </Stack>
        </Stack>
      </DashboardWidget>
    )
  }

  const showCompact = variant === 'compact'
  const chartHeight = showCompact ? 200 : 300
  const chartRadius = showCompact ? 80 : 120

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Heading variant="h4">Soft Skills Analysis</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="xs"
              onPress={() => {
                router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
              }}
            >
              Edit
            </Button>
          )}
        </Row>

        {/* Category Tabs */}
        {skills.length > 0 && (
          <>
            <SoftSkillsCategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <Separator />
          </>
        )}

        {/* Chart Comparison */}
        {categoryChartData && categoryChartData.length > 0 && (
          <Stack gap={16}>
            <Text style={{ color: colors.text[theme].secondary }} style={{ textAlign: 'center' }}>
              {categoryLabels[activeCategory]} Skills
            </Text>

            {/* Main Skills Chart */}
            <Stack align="center" paddingVertical={16}>
              <SkillsChart
                datasets={categoryChartData}
                height={chartHeight}
                radius={chartRadius}
                maxValue={100}
                isAnimated={true}
                showSets={categoryChartData.length > 1 ? [0, 1] : [0]}
                showDots={true}
                dotSize={5}
                style={{ backgroundColor: colors.bg[theme].subtle }}
                gridColor="$color5"
                labelColor="colors.text[theme].secondary"
              />
            </Stack>

            {/* Legend */}
            {categoryChartData.length > 1 && (
              <Row gap={16} align="center" justify="center" paddingVertical={8}>
                <Row gap={8} align="center">
                  <Stack width={20} height={3} style={{ backgroundColor: colors.bg[theme].primary }} />
                  <Text style={{ color: colors.text[theme].secondary }}>Self Assessment</Text>
                </Row>
                <Row gap={8} align="center">
                  <Stack width={20} height={3} style={{ backgroundColor: colors.bg[theme].success }} />
                  <Text style={{ color: colors.text[theme].secondary }}>Peer Average</Text>
                </Row>
              </Row>
            )}

            <Text style={{ color: colors.text[theme].secondary }} style={{ textAlign: 'center' }}>
              Individual skill ratings in {categoryLabels[activeCategory]}
            </Text>
          </Stack>
        )}

        {/* CTA button for completed assessments when showCTA is true */}
        {isCompleted && showCTA && (
          <Button variant="outline" onPress={handleNavigateToAssessment}>
            Update Assessment
          </Button>
        )}
      </Stack>
    </DashboardWidget>
  )
}
