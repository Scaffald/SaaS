import { Stack, useResponsive } from '@scaffald/ui'
import {
  CompactNewsWidget,
  RecentActivityWidget,
  SuggestedContactsWidget,
  GrowthTipCard,
} from './components'

export function DashboardIndexRight() {
  const { isMobile } = useResponsive()

  // On mobile, these widgets are shown inside MobileDashboardTabs
  if (isMobile) return null

  return (
    <Stack gap={20}>
      <GrowthTipCard />
      <CompactNewsWidget />
      <RecentActivityWidget />
      <SuggestedContactsWidget />
    </Stack>
  )
}
