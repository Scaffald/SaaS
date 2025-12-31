import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { YStack } from '@unicornlove/ui'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../profile/widgets'
import { RIASECAssessmentWidget } from '../riasec-assessment'

/**
 * Dashboard Index Left Component
 * Shows ProfileSnapshotWidget and assessment widgets
 * Prerequisites are now enforced at the route level via /onboarding
 */
export function DashboardIndexLeft() {
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
