import { Stack, useResponsive } from '@scaffald/ui'
import {
  MobileProfileHero,
  MobileProfileStrength,
  MobileQuickActions,
  MobileGrowthTip,
  MobileDashboardTabs,
  AnalyticsWidget,
  ProfileIdentityWidget,
  AssessmentsCarouselWidget,
} from './components'

/**
 * Dashboard Index Left Component
 * Mobile: profile hero, quick actions, strength card, growth tip, tabbed widgets
 * Desktop: Analytics → Profile Identity → Assessments Carousel (Stitch "Earthen Conservatory" design)
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
      <ProfileIdentityWidget />
      <AssessmentsCarouselWidget />
    </Stack>
  )
}
