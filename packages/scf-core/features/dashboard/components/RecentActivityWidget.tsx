import { useProfileViews } from '@scf/core/utils/profile-views-sdk-hooks'
import { useFollowers } from '@scf/core/utils/engagement-sdk-hooks'
import {
  DashboardWidget,
  DashboardWidgetHeader,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type ActivityItem = {
  id: string
  parts: Array<{ text: string; bold?: boolean; accent?: boolean }>
  timestamp: string
}

function formatTimeAgo(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const hours = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const { theme } = useThemeContext()

  return (
    <Stack gap={4}>
      <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 19 }}>
        {item.parts.map((part, i) => {
          if (part.bold) {
            return (
              <Text
                key={i}
                style={{ fontSize: 13, fontWeight: '700', color: colors.text[theme].primary }}
              >
                {part.text}
              </Text>
            )
          }
          if (part.accent) {
            return (
              <Text
                key={i}
                style={{ fontSize: 13, fontWeight: '500', color: colors.primary[600] }}
              >
                {part.text}
              </Text>
            )
          }
          return part.text
        })}
      </Text>
      <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
        {item.timestamp}
      </Text>
    </Stack>
  )
}

/**
 * RecentActivityWidget
 * Shows real profile views and new followers as an activity feed.
 * Falls back to empty state when no data is available.
 */
export function RecentActivityWidget() {
  const { data: viewsData, isLoading: viewsLoading } = useProfileViews({ limit: 3 })
  const { data: followersData, isLoading: followersLoading } = useFollowers()

  const isLoading = viewsLoading || followersLoading

  if (isLoading) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Recent Activity" />
        <SkeletonGroup gap={16} animation="wave">
          {[1, 2, 3].map((i) => (
            <Stack key={i} gap={4}>
              <Skeleton width="90%" height={14} borderRadius={4} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </Stack>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  // Build activity items from real data
  const items: ActivityItem[] = []

  // Add profile views
  const views = (viewsData as { views?: Array<{ id: string; viewed_at: string; viewer?: { display_name?: string | null } | null }> })?.views ?? []
  for (const view of views.slice(0, 3)) {
    const viewerName = view.viewer?.display_name ?? 'Someone'
    items.push({
      id: `view-${view.id}`,
      parts: [
        { text: `${viewerName}`, bold: true },
        { text: ' viewed your profile' },
      ],
      timestamp: formatTimeAgo(view.viewed_at),
    })
  }

  // Add new followers
  const followers = (followersData as { data?: Array<{ id: string; created_at?: string; follower?: { display_name?: string | null } | null }> })?.data ?? []
  for (const follower of followers.slice(0, 2)) {
    const followerName = follower.follower?.display_name ?? 'Someone'
    items.push({
      id: `follower-${follower.id}`,
      parts: [
        { text: `${followerName}`, bold: true },
        { text: ' started following you' },
      ],
      timestamp: follower.created_at ? formatTimeAgo(follower.created_at) : '',
    })
  }

  // Sort by recency (most recent first) and limit to 4
  const displayItems = items.slice(0, 4)

  if (displayItems.length === 0) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Recent Activity" />
        <Text style={{ fontSize: 13, color: colors.text.light.tertiary }}>
          No recent activity yet. Complete your profile to start getting noticed.
        </Text>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Recent Activity" />
      <Stack gap={16}>
        {displayItems.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </Stack>
    </DashboardWidget>
  )
}
