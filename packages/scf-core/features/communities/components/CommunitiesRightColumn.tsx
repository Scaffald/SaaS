import { Stack } from '@scaffald/ui'
import { CommunityStatsWidget } from './CommunityStatsWidget'
import { SuggestedCommunitiesWidget } from './SuggestedCommunitiesWidget'
import { CommunityActivityWidget } from './CommunityActivityWidget'

/**
 * Composed right-column content for /communities pages.
 * Stacks network stats, suggested communities, and recent activity.
 */
export function CommunitiesRightColumn() {
  return (
    <Stack gap={20}>
      <CommunityStatsWidget />
      <SuggestedCommunitiesWidget />
      <CommunityActivityWidget />
    </Stack>
  )
}
