import { YStack, Spinner, Text } from 'tamagui'
import { ProfileSnapshotWidget } from '../profile/widgets'
import { PrerequisiteWidget } from '../prerequisites/PrerequisiteWidget'
import { LuscherTest1Widget } from '../luscher-test-1'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { LuscherTest2Widget } from '../luscher-test-2'
import { RIASECAssessmentWidget } from '../riasec-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { api } from '@app/core/utils/api'
import { ProfileCompletionExperience } from '../profile-completion/components/ProfileCompletionExperience'
import { ResumeImportWidget } from '@app/core/features/resume'

/**
 * Dashboard Index Left Component
 * Shows PrerequisiteWidget when prerequisites are incomplete,
 * otherwise shows ProfileSnapshotWidget, CareerAssessmentWidget, and PersonalityAssessmentWidget
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

  // Show ProfileSnapshotWidget and individual assessment widgets if prerequisites are complete
  return (
    <YStack gap="$4">
      <ResumeImportWidget />
      <ProfileCompletionExperience />
      <ProfileSnapshotWidget />
      <LuscherTest1Widget />
      <IPIPAssessmentWidget />
      <LuscherTest2Widget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </YStack>
  )
}
