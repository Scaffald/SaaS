import { useRecentActivity } from '@scf/core/utils/engagement-sdk-hooks'
import type { EngagementEvent } from '@scaffald/sdk'
import { EmptyState, Skeleton, SkeletonGroup, Stack, Text, useThemeContext } from '@scaffald/ui'
import { borderRadius, colors, fontSize } from '@scaffald/ui/tokens'
import { Activity } from 'lucide-react-native'
import { toActivityRows } from '../home-activity-rows'
import { HomeSection } from './HomeSection'

/**
 * The worker's own recent activity.
 *
 * Profile viewers moved to their own band (ProfileViewersWidget). They were
 * folded in here as one line, "You appeared in N searches this week", built
 * from the all-time profile-view total — neither searches nor this week, so
 * the line is gone (#1172).
 */
export function RecentActivityWidget() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data: activity, isLoading } = useRecentActivity({ limit: 5 })

  if (isLoading) {
    return (
      <Stack gap={16}>
        <SkeletonGroup gap={16} animation="wave">
          <Skeleton width={120} height={18} borderRadius={borderRadius.xs} />
          {[1, 2, 3].map((i) => (
            <Stack key={i} gap={4}>
              <Skeleton width="90%" height={12} />
              <Skeleton width={80} height={10} />
            </Stack>
          ))}
        </SkeletonGroup>
      </Stack>
    )
  }

  // RecentActivityResponse = { data: EngagementEvent[] }
  const events: EngagementEvent[] = activity?.data ?? []
  const rows = toActivityRows(events, 3)

  return (
    <HomeSection title="Recent activity">
      {rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Jobs you view and applications you start will show up here."
        />
      ) : (
        <Stack gap={14}>
          {rows.map((row) => (
            <Stack key={row.id} gap={4}>
              <Text
                style={{ fontSize: fontSize.sm, color: colors.text[t].secondary, lineHeight: 19 }}
              >
                {row.text}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xxs,
                  fontWeight: '500',
                  color: colors.text[t].tertiary,
                }}
              >
                {row.when}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}
    </HomeSection>
  )
}
