import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { api } from '@scf/core/utils/api'
import { SkeletonCard } from '@unicornlove/ui'
import { YStack } from '@unicornlove/ui'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { PrerequisiteWidget } from '../prerequisites/PrerequisiteWidget'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../profile/widgets'
import { RIASECAssessmentWidget } from '../riasec-assessment'

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
      <SoftSkillsComparisonWidget showCTA />
      <InquiryOverviewWidget />
      <IPIPAssessmentWidget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </YStack>
  )
}
