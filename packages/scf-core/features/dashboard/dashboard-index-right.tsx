import { Stack, useResponsive } from '@scaffald/ui'
import {
  AssessmentsCarouselWidget,
  GrowthTipCard,
  RecentActivityWidget,
  SuggestedContactsWidget,
} from './components'

export function DashboardIndexRight() {
  const { isMobile } = useResponsive()

  if (isMobile) return null

  return (
    <Stack gap={20}>
      <GrowthTipCard />
      <AssessmentsCarouselWidget />
      <RecentActivityWidget />
      <SuggestedContactsWidget />
    </Stack>
  )
}
