import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import { useEngagementMetrics } from '@scf/core/utils/engagement-sdk-hooks'
import type { EngagementMetrics } from '@scaffald/sdk'
import {
  DashboardWidget,
  MetricBlock,
  MetricRow,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '0'
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1_000) return n.toLocaleString()
  return String(n)
}

/**
 * A trend as the metric block's delta line.
 *
 * Null when there is no trend to report — the block simply omits the line
 * rather than rendering a confident "0%".
 */
function deltaLabel(trend: number | undefined | null): string | undefined {
  if (trend == null || trend === 0) return undefined
  return `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}%`
}

/**
 * Direction is not sentiment, but for these three metrics it happens to be:
 * more views and more search appearances are unambiguously good for a worker.
 * Stated here rather than assumed inside MetricBlock, which serves metrics
 * (ghost rate) where up is bad.
 */
function deltaTone(trend: number | undefined | null): 'positive' | 'attention' | 'neutral' {
  if (trend == null || trend === 0) return 'neutral'
  return trend > 0 ? 'positive' : 'attention'
}

export function AnalyticsWidget() {
  const { theme } = useThemeContext()
  const { data: analytics, isLoading: loadingAnalytics } = useViewAnalytics()
  const { data: metrics, isLoading: loadingMetrics } = useEngagementMetrics({ days: 30 })

  const isLoading = loadingAnalytics || loadingMetrics

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Row justify="space-between" align="center">
            <Skeleton width={100} height={20} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </Row>
          <Row gap={16} wrap>
            {[1, 2, 3].map((i) => (
              <Stack key={i} flex={1} minWidth={140} gap={8} padding={16}>
                <Skeleton width={100} height={12} />
                <Skeleton width={60} height={24} />
                <Skeleton width="100%" height={32} borderRadius={4} />
              </Stack>
            ))}
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Row justify="space-between" align="center" paddingBottom={8}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          Analytics
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary[600],
          }}
        >
          View details
        </Text>
      </Row>
      {/* The shared metric block: label above, figure below, delta beneath.
          Two things were removed here rather than restyled.

          The trends: only Profile views had a real one. Search appearances was
          `trend={5}` and Post impressions `trend={0}` — hardcoded numbers
          rendered in the same badge as the live one, so two thirds of the
          movement on this widget was invented. A metric with no trend now
          shows no delta, which is honest and reads fine.

          The sparklines: all three were hardcoded SVG path strings, and all
          three were DIFFERENT — so each metric appeared to have its own
          history, drawn from nothing. A fabricated trend line is worse than a
          missing one; it is a specific claim about the past. Gone until the
          endpoint returns a series. */}
      <MetricRow>
        <MetricBlock
          label="Profile views"
          value={formatNumber(analytics?.views30d)}
          delta={deltaLabel(analytics?.trend)}
          tone={deltaTone(analytics?.trend)}
        />
        <MetricBlock
          label="Search appearances"
          value={formatNumber((metrics as EngagementMetrics | undefined)?.searches)}
        />
        <MetricBlock
          label="Post impressions"
          value={formatNumber((metrics as EngagementMetrics | undefined)?.profile_views)}
        />
      </MetricRow>
    </DashboardWidget>
  )
}
