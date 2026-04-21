import { Stack, useResponsive, usePageBottomBar } from '@scaffald/ui'
import {
  MobileProfileHero,
  GrowthCard,
  MobileQuickActions,
  MobileDashboardTabs,
  AnalyticsWidget,
  CommunitiesWidget,
  CompactNewsWidget,
} from './components'

/**
 * Dashboard Index Left Component
 * Mobile: profile hero, quick actions, strength card, growth tip, tabbed widgets
 * Desktop: Analytics → Profile Identity → Assessments Carousel (Stitch "Earthen Conservatory" design)
 * Prerequisites are now enforced at the route level via /onboarding
 */
export function DashboardIndexLeft() {
  const { isMobile } = useResponsive()
  // Hide the global MobileBottomNav on the dashboard index
  usePageBottomBar('dashboard-index', isMobile)

  if (isMobile) {
    return (
      <Stack gap={16}>
        <MobileProfileHero />
        <MobileQuickActions />
        <GrowthCard />
        <MobileDashboardTabs />
      </Stack>
    )
  }

  return (
    <Stack gap={20}>
      <AnalyticsWidget />
      <CommunitiesWidget />
      <CompactNewsWidget />
    </Stack>
  )
}
