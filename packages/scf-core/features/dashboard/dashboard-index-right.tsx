import { Stack, useResponsive } from '@scaffald/ui'
import {
  AssessmentsCarouselWidget,
  GrowthCard,
  ProfileHero,
  RecentActivityWidget,
  SuggestedContactsWidget,
} from './components'

export function DashboardIndexRight() {
  const { isMobile } = useResponsive()

  if (isMobile) return null

  return (
    <Stack gap={20}>
      <ProfileHero />
      <GrowthCard />
      <AssessmentsCarouselWidget />
      <RecentActivityWidget />
      <SuggestedContactsWidget />
    </Stack>
  )
}
