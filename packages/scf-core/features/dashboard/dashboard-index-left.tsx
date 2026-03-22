import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Stack, useResponsive } from '@scaffald/ui'
import { IPIPAssessmentWidget } from '../ipip-assessment'
import { OccupationAssessmentWidget } from '../occupation-assessment'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../profile/widgets'
import { RIASECAssessmentWidget } from '../riasec-assessment'
import { WeeklyPulseWidget } from '../luscher-test/components/WeeklyPulseWidget'
import {
  MobileProfileHero,
  MobileProfileStrength,
  MobileQuickActions,
  MobileGrowthTip,
  MobileDashboardTabs,
} from './components'
import { AnalyticsWidget } from './components/AnalyticsWidget'
import { AssessmentsCarouselWidget } from './components/AssessmentsCarouselWidget'
import { CareerRecommendationsWidget } from './widgets/CareerRecommendationsWidget'
import { SkillsGapWidget } from './widgets/SkillsGapWidget'
import { CareerPathWidget } from './widgets/CareerPathWidget'
import { TechnologySkillsWidget } from './widgets/TechnologySkillsWidget'

/**
 * Dashboard Index Left Component
 * Mobile: profile hero, quick actions, strength card, growth tip, tabbed widgets
 * Desktop: flat widget list (unchanged)
 * Prerequisites are now enforced at the route level via /onboarding
 */
export function DashboardIndexLeft() {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <Stack gap={16}>
        <MobileProfileHero />
        <MobileQuickActions />
        <MobileProfileStrength />
        <MobileGrowthTip />
        <MobileDashboardTabs />
      </Stack>
    )
  }

  return (
    <Stack gap={20}>
      <AnalyticsWidget />
      <ProfileSnapshotWidget />
      <AssessmentsCarouselWidget />
      <SoftSkillsComparisonWidget showCTA />
      <InquiryOverviewWidget />
      <WeeklyPulseWidget />
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
