import { useRecentActivity } from '@scf/core/utils/engagement-sdk-hooks'
import { useProfileViews } from '@scf/core/utils/profile-views-sdk-hooks'
import type { EngagementEvent } from '@scaffald/sdk'
import {
  DashboardWidget,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

const formatTimeAgo = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  const hours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return dateObj.toLocaleDateString()
}

type ActivityEntry = {
  id: string
  text: React.ReactNode
  timestamp: string
}

export function RecentActivityWidget() {
  const { theme } = useThemeContext()
  const { data: activity, isLoading: loadingActivity } = useRecentActivity({ limit: 5 })
  const { data: views, isLoading: loadingViews } = useProfileViews({ limit: 5 })

  const isLoading = loadingActivity || loadingViews

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Skeleton width={120} height={18} borderRadius={4} />
          {[1, 2, 3].map((i) => (
            <Stack key={i} gap={4}>
              <Skeleton width="90%" height={12} />
              <Skeleton width={80} height={10} />
            </Stack>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  // Build activity entries from available data
  const entries: ActivityEntry[] = []

  // Add real activity items — RecentActivityResponse = { data: EngagementEvent[] }
  const activityItems: EngagementEvent[] = activity?.data ?? []
  for (const item of activityItems.slice(0, 3)) {
    const label = item.event_type.replace(/_/g, ' ')
    entries.push({
      id: `activity-${item.id}`,
      text: (
        <Text style={{ fontSize: 12, color: colors.text[theme].secondary, lineHeight: 16 }}>
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Text>
      ),
      timestamp: formatTimeAgo(item.occurred_at ?? item.created_at),
    })
  }

  // Add profile view entries — GetProfileViewsResponse = { views: ProfileView[], total: number }
  const viewCount = views?.total ?? 0
  if (viewCount > 0) {
    entries.push({
      id: 'views-summary',
      text: (
        <Text style={{ fontSize: 12, color: colors.text[theme].secondary, lineHeight: 16 }}>
          You appeared in{' '}
          <Text style={{ fontWeight: '700', color: colors.text[theme].primary }}>
            {viewCount} searches
          </Text>
          {' '}this week
        </Text>
      ),
      timestamp: 'This week',
    })
  }

  // Fallback if no activity
  if (entries.length === 0) {
    return (
      <DashboardWidget>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.text[theme].primary,
            marginBottom: 12,
          }}
        >
          Recent Activity
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
          No recent activity to show
        </Text>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.text[theme].primary,
          marginBottom: 4,
        }}
      >
        Recent Activity
      </Text>
      <Stack gap={16}>
        {entries.map((entry) => (
          <Stack key={entry.id} gap={2}>
            {entry.text}
            <Text
              style={{
                fontSize: 10,
                color: colors.text[theme].secondary,
                opacity: 0.6,
              }}
            >
              {entry.timestamp}
            </Text>
          </Stack>
        ))}
      </Stack>
    </DashboardWidget>
  )
}
