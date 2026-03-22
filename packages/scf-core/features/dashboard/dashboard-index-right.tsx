import { Stack } from '@scaffald/ui'
import {
  CompactNewsWidget,
  RecentActivityWidget,
  SuggestedContactsWidget,
  GrowthTipCard,
} from './components'

export function DashboardIndexRight() {
  return (
    <Stack gap={20}>
      <GrowthTipCard />
      <CompactNewsWidget />
      <RecentActivityWidget />
      <SuggestedContactsWidget />
    </Stack>
  )
}
