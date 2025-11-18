import { YStack, Text } from 'tamagui'
import { ProfileSnapshotWidget } from '../profile/widgets'
import { PrerequisiteWidget } from '../prerequisites/PrerequisiteWidget'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { RIASECAssessmentWidget } from '../riasec-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { api } from '@app/core/utils/api'
import { ProfileCompletionExperience } from '../profile-completion/components/ProfileCompletionExperience'
import { ResumeImportWidget } from '@app/core/features/resume'
import { SkeletonCard } from '@app/ui'
import { InquiryOverviewWidget } from '@app/core/features/inquiries/components/InquiryOverviewWidget'

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
      <YStack gap="$4">
        <SkeletonCard variant="profile" />
        <SkeletonCard variant="profile" />
        <SkeletonCard variant="profile" />
        <SkeletonCard variant="profile" />
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
      {/* <ResumeImportWidget /> */}
      {/* <ProfileCompletionExperience /> */}
      <ProfileSnapshotWidget />
      <InquiryOverviewWidget />
      <IPIPAssessmentWidget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </YStack>
  )
}
