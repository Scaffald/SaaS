import { YStack, Spinner, Text } from 'tamagui'
import { ProfileSnapshotWidget } from '../profile/widgets'
import { PrerequisiteWidget } from '../prerequisites/PrerequisiteWidget'
import { CareerAssessmentWidget } from '../career-assessment'
import { api } from '@app/core/utils/api'

/**
 * Dashboard Index Left Component
 * Shows PrerequisiteWidget when prerequisites are incomplete,
 * otherwise shows ProfileSnapshotWidget and CareerAssessmentWidget
 */
export function DashboardIndexLeft() {
  const { data: statusData, isLoading } = api.prerequisites.check.useQuery()

  // Show loading state while checking prerequisites
  if (isLoading) {
    return (
      <YStack gap="$3" items="center" py="$8">
        <Spinner size="large" />
        <Text color="$color11">Loading...</Text>
      </YStack>
    )
  }

  // Show PrerequisiteWidget if prerequisites are incomplete
  if (!statusData?.isComplete) {
    return <PrerequisiteWidget />
  }

  // Show ProfileSnapshotWidget and CareerAssessmentWidget if prerequisites are complete
  return (
    <YStack gap="$4">
      <ProfileSnapshotWidget />
      <CareerAssessmentWidget />
    </YStack>
  )
}
