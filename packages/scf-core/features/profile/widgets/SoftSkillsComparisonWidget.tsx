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
  DashboardWidgetHeader,
  EmptyState,
  Skeleton,
  SkeletonBox,
  useThemeContext,
} from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useMemo, useState, type FC } from 'react'
import { Separator, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ProfileWidgetProps } from './types'

interface SkillsChartDataset {
  label: string
  data: { label: string; value: number }[]
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  fillOpacity?: number
  gradient?: {
    startColor: string
    endColor: string
  }
}

/**
 * SoftSkillsComparisonWidget component
 *
 * Displays soft skills analysis with category tabs and radar chart visualization.
 * Supports CTA button for incomplete assessments (dashboard use case).
 */
export const SoftSkillsComparisonWidget: FC<ProfileWidgetProps> = ({
  userId,
  showEdit = false,
  variant = 'full',
  showCTA = false,
}) => {
  const router = useRouter()
  const { theme } = useThemeContext()
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

  // Calculate skills chart data for the active category
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
        fillColor: colors.blue[200],
        strokeColor: colors.blue[700],
        strokeWidth: 3,
        fillOpacity: 0.02,
        gradient: {
          startColor: colors.blue[500],
          endColor: colors.blue[200],
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
          fillColor: colors.green[100],
          strokeColor: colors.green[700],
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
        <Stack gap={12}>
          <Skeleton width={160} height={20} shape="text" />
          <SkeletonBox width="100%" height={200} borderRadius={12} />
        </Stack>
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load soft skills</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show empty state when no data or no skills
  if (!data || data.skills.length === 0) {
    return (
      <DashboardWidget>
        <Stack gap={16}>
          <DashboardWidgetHeader title="Soft Skills Analysis" />
          <EmptyState
            title="No soft skills assessment"
            description="Complete your soft skills assessment to see your profile"
          />
          {showCTA && (
            <Button variant="filled" color="primary" onPress={handleNavigateToAssessment}>
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
        <Stack gap={16}>
          <DashboardWidgetHeader title="Soft Skills Analysis" />
          <Stack gap={16}>
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
                Complete your soft skills assessment to showcase your strengths and improve job
                matching.
              </Text>
              <Text style={{ color: colors.text[theme].secondary }}>{completionCount} of 25 skills rated</Text>
            </Stack>
            <Button variant="filled" color="primary" onPress={handleNavigateToAssessment}>
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
      <Stack gap={16}>
        {/* Header */}
        <DashboardWidgetHeader
          title="Soft Skills Analysis"
          action={
            showEdit ? (
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }}
              >
                Edit
              </Button>
            ) : undefined
          }
        />

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
            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              {categoryLabels[activeCategory]} Skills
            </Text>

            {/* Skills chart placeholder - SkillsChart not available in @scaffald/ui */}
            <Stack align="center" paddingVertical={16} style={{ height: chartHeight }}>
              <Text style={{ color: colors.text[theme].secondary }}>
                Chart radius: {chartRadius}px
              </Text>
            </Stack>

            {/* Legend */}
            {categoryChartData.length > 1 && (
              <Row gap={16} align="center" justify="center" paddingVertical={8}>
                <Row gap={8} align="center">
                  <Stack width={20} height={3} backgroundColor={colors.blue[700]} />
                  <Text style={{ color: colors.text[theme].secondary }}>Self Assessment</Text>
                </Row>
                <Row gap={8} align="center">
                  <Stack width={20} height={3} backgroundColor={colors.green[700]} />
                  <Text style={{ color: colors.text[theme].secondary }}>Peer Average</Text>
                </Row>
              </Row>
            )}

            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
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
