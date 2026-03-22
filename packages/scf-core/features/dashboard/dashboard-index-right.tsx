import {
  ProfileActivityWidget,
  TeamInvitationsWidget,
} from '@scf/core/features/dashboard/components'
import { GrowthTipCard } from '@scf/core/features/dashboard/components/GrowthTipCard'
import { NewsWidget } from '@scf/core/features/news'
import { CommunityActivityWidget } from '@scf/core/features/communities'
import { Stack } from '@scaffald/ui'

export function DashboardIndexRight() {
  return (
    <Stack gap={20}>
      <GrowthTipCard />
      <ProfileActivityWidget />
      <TeamInvitationsWidget />
      <CommunityActivityWidget maxItems={3} />
      <NewsWidget industry="construction" maxItems={6} />
    </Stack>
  )
}
