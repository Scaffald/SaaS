import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Stack } from '@scaffald/ui'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../profile/widgets'
import { RIASECAssessmentWidget } from '../riasec-assessment'
import { MobileDashboardGreeting, MobileQuickActions } from './components'
import { CareerRecommendationsWidget } from './widgets/CareerRecommendationsWidget'
import { SkillsGapWidget } from './widgets/SkillsGapWidget'
import { CareerPathWidget } from './widgets/CareerPathWidget'
import { TechnologySkillsWidget } from './widgets/TechnologySkillsWidget'

/**
 * Dashboard Index Left Component
 * Shows ProfileSnapshotWidget, assessment widgets, and career widgets (Issue #103)
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
      {/* Career widgets (Issue #103) - shown after career assessment is complete */}
      <CareerRecommendationsWidget />
      <SkillsGapWidget />
      <CareerPathWidget />
      <TechnologySkillsWidget />
    </Stack>
  )
}
