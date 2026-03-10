import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Stack } from '@scaffald/ui'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../profile/widgets'
import { RIASECAssessmentWidget } from '../riasec-assessment'
import { MobileDashboardGreeting, MobileQuickActions } from './components'

/**
 * Dashboard Index Left Component
 * Shows ProfileSnapshotWidget and assessment widgets
 * Prerequisites are now enforced at the route level via /onboarding
 */
export function DashboardIndexLeft() {
  return (
    <Stack gap={20}>
      <MobileDashboardGreeting />
      <MobileQuickActions />
      {/* <ResumeImportWidget /> */}
      {/* <ProfileCompletionExperience /> */}
      <ProfileSnapshotWidget />
      <SoftSkillsComparisonWidget showCTA />
      <InquiryOverviewWidget />
      <IPIPAssessmentWidget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </Stack>
  )
}
