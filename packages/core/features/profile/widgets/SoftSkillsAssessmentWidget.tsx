import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import {
  DashboardWidget,
  Heading,
  LoadingState,
  SkillsChart,
  spacing,
  UIButton,
  type SkillsChartDataset,
} from '@app/ui'
import { useRouter } from 'expo-router'
import { type FC, useMemo } from 'react'
import { Text, View, XStack, YStack } from 'tamagui'

/**
 * Format timestamp to human-readable relative time
 */
const formatRelativeTime = (timestamp: string | Date | null | undefined): string => {
  if (!timestamp) return 'Never'

  // Handle both string and Date object inputs
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

  // Validate the date is valid
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months !== 1 ? 's' : ''} ago`
  }
  const years = Math.floor(diffDays / 365)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

/**
 * SoftSkillsAssessmentWidget
 *
 * Dashboard widget that prompts users to complete their soft skills assessment
 * and displays completion status with a mini radar chart preview.
 */
export const SoftSkillsAssessmentWidget: FC = () => {
  const router = useRouter()
  const { data, isLoading, error } = api.profile.skills.getSoftSkills.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Calculate completion status and category averages
  const { isCompleted, lastUpdated, categoryAverages, completionCount } = useMemo(() => {
    if (!data) {
      return {
        isCompleted: false,
        lastUpdated: null,
        categoryAverages: {
          reliability: 0,
          collaboration: 0,
          professionalism: 0,
          technical: 0,
        },
        completionCount: 0,
      }
    }

    const { skills, lastUpdated: updatedAt, categoryAverages: averages } = data

    // Count how many skills have ratings
    const ratedSkills = skills.filter(
      (skill) => skill.rating !== null && skill.rating !== undefined
    )
    const completed = ratedSkills.length === 25 // All 25 soft skills should be rated

    return {
      isCompleted: completed,
      lastUpdated: updatedAt,
      categoryAverages: averages,
      completionCount: ratedSkills.length,
    }
  }, [data])

  // Prepare data for mini radar chart (category averages)
  const chartDatasets = useMemo<SkillsChartDataset[]>(() => {
    return [
      {
        label: 'Assessment',
        data: [
          { value: categoryAverages.reliability, label: 'Reliability' },
          { value: categoryAverages.collaboration, label: 'Collaboration' },
          { value: categoryAverages.professionalism, label: 'Professionalism' },
          { value: categoryAverages.technical, label: 'Technical' },
        ],
        fillColor: '$blue4',
        strokeColor: '$blue9',
        strokeWidth: 2,
        fillOpacity: 0.02,
        gradient: {
          startColor: '$blue8',
          endColor: '$blue4',
        },
      },
    ]
  }, [categoryAverages])

  const handleNavigateToAssessment = () => {
    router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading soft skills assessment..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load assessment</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Soft Skills Assessment</Heading>
          {isCompleted && (
            <Text fontSize="$2" color="$color10">
              {formatRelativeTime(lastUpdated)}
            </Text>
          )}
        </XStack>

        {/* Content */}
        {!isCompleted ? (
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

            <UIButton variant="primary" onPress={handleNavigateToAssessment}>
              Complete Soft Skills Assessment
            </UIButton>
          </YStack>
        ) : (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$3" color="$color11">
                Your soft skills assessment is complete. Update it anytime to reflect your growth.
              </Text>
              <Text fontSize="$2" color="$color10">
                Last updated {formatRelativeTime(lastUpdated)}
              </Text>
            </YStack>

            {/* Mini Radar Chart Preview */}
            <View items="center" py="$2">
              <SkillsChart
                datasets={chartDatasets}
                height={180}
                radius={70}
                maxValue={5}
                isAnimated={true}
                showDots={true}
                dotSize={3}
                bg="$color2"
                gridColor="$color5"
                labelColor="$color11"
              />
            </View>

            <UIButton variant="outlined" onPress={handleNavigateToAssessment}>
              Update Assessment
            </UIButton>
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
