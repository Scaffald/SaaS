import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
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
} from '@unicornlove/ui'
import { useRouter } from 'expo-router'
import { useMemo, useState, type FC } from 'react'
import { Separator, Text, XStack, YStack } from '@unicornlove/ui'
import type { ProfileWidgetProps } from './types'

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
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')

  // Fetch soft skills data
  // When userId is undefined, query for current user (API handles this)
  const { data, isLoading, error } = api.profile.skills.getSoftSkills.useQuery(
    userId ? { userId } : undefined,
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Fetch peer comparison data
  const { data: comparisonData } = api.profile.skills.getSoftSkillsComparison.useQuery(undefined, {
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
        fillColor: '$blue4',
        strokeColor: '$blue9',
        strokeWidth: 3,
        fillOpacity: 0.02,
        gradient: {
          startColor: '$blue8',
          endColor: '$blue4',
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
          fillColor: '$green4',
          strokeColor: '$green9',
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
        <YStack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load soft skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show empty state when no data or no skills
  if (!data || data.skills.length === 0) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.md}>
          <XStack justifyContent="space-between" alignItems="center">
            <Heading variant="h4">Soft Skills Analysis</Heading>
          </XStack>
          <EmptyState
            title="No soft skills assessment"
            description="Complete your soft skills assessment to see your profile"
            icon={undefined}
          />
          {showCTA && (
            <Button variant="primary" onPress={handleNavigateToAssessment}>
              Complete Soft Skills Assessment
            </Button>
          )}
        </YStack>
      </DashboardWidget>
    )
  }

  // Show incomplete state with CTA when assessment is not complete
  if (!isCompleted && showCTA) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.md}>
          <XStack justifyContent="space-between" alignItems="center">
            <Heading variant="h4">Soft Skills Analysis</Heading>
          </XStack>
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$3" color="$color11">
                Complete your soft skills assessment to showcase your strengths and improve job
                matching.
              </Text>
              <Text fontSize="$2" color="$color10">
                {completionCount} of 25 skills rated
              </Text>
            </YStack>
            <Button variant="primary" onPress={handleNavigateToAssessment}>
              Complete Soft Skills Assessment
            </Button>
          </YStack>
        </YStack>
      </DashboardWidget>
    )
  }

  const showCompact = variant === 'compact'
  const chartHeight = showCompact ? 200 : 300
  const chartRadius = showCompact ? 80 : 120

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Soft Skills Analysis</Heading>
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
        </XStack>

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
          <YStack gap="$4">
            <Text fontSize="$4" fontWeight="600" color="$color12" style={{ textAlign: 'center' }}>
              {categoryLabels[activeCategory]} Skills
            </Text>

            {/* Main Skills Chart */}
            <YStack alignItems="center" paddingVertical="$4">
              <SkillsChart
                datasets={categoryChartData}
                height={chartHeight}
                radius={chartRadius}
                maxValue={100}
                isAnimated={true}
                showSets={categoryChartData.length > 1 ? [0, 1] : [0]}
                showDots={true}
                dotSize={5}
                backgroundColor="$color2"
                gridColor="$color5"
                labelColor="$color11"
              />
            </YStack>

            {/* Legend */}
            {categoryChartData.length > 1 && (
              <XStack gap="$4" alignItems="center" justifyContent="center" paddingVertical="$2">
                <XStack gap="$2" alignItems="center">
                  <YStack width={20} height={3} backgroundColor="$blue9" />
                  <Text fontSize="$2" color="$color11">
                    Self Assessment
                  </Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <YStack width={20} height={3} backgroundColor="$green9" />
                  <Text fontSize="$2" color="$color11">
                    Peer Average
                  </Text>
                </XStack>
              </XStack>
            )}

            <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
              Individual skill ratings in {categoryLabels[activeCategory]}
            </Text>
          </YStack>
        )}

        {/* CTA button for completed assessments when showCTA is true */}
        {isCompleted && showCTA && (
          <Button variant="outlined" onPress={handleNavigateToAssessment}>
            Update Assessment
          </Button>
        )}
      </YStack>
    </DashboardWidget>
  )
}
