import { Stack, useResponsive } from '@scaffald/ui'
import {
  ProfileHero,
  GrowthCard,
  MobileDashboardTabs,
  AnalyticsWidget,
  CommunitiesWidget,
  CompactNewsWidget,
} from './components'

/**
 * Dashboard Index Left Component
 * Mobile: profile hero, quick actions, strength card, growth tip, widget stack
 * Desktop: Analytics → Profile Identity → Assessments Carousel
 * Prerequisites are now enforced at the route level via /onboarding
 */
export function DashboardIndexLeft() {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <Stack gap={16}>
        <ProfileHero />
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
