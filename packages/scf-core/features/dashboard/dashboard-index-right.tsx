import { Separator, Stack, useResponsive } from '@scaffald/ui'
import { CommunitiesWidget, CompactNewsWidget, SuggestedContactsWidget } from './components'

/**
 * The desktop second column: the reading material.
 *
 * It used to repeat the profile hero and the growth card that the main
 * column already showed, then add the assessments carousel and two more
 * widgets — so on a wide screen the same profile percentage appeared twice,
 * side by side. What belongs here is what a worker browses rather than acts
 * on: communities, news, people to meet.
 */
export function DashboardIndexRight() {
  const { isMobile } = useResponsive()

  if (isMobile) return null

  return (
    <Stack gap={24}>
      <CommunitiesWidget />
      <Separator />
      <CompactNewsWidget />
      <Separator />
      <SuggestedContactsWidget />
    </Stack>
  )
}
