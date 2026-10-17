import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import { useAnalyticsSummary } from '@scf/core/utils/analytics-sdk-hooks'
import { MetricBlock, MetricRow, Row, Skeleton, SkeletonGroup, Stack } from '@scaffald/ui'
import { useMyTeamInvitations } from '@scaffald/sdk/react'

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

/**
 * Home's figures, directly under the greeting (#1033).
 *
 * These were an "Analytics" band at the bottom of the page. The prototype puts
 * the metric row second, right after the header, because the figures are the
 * answer to "is anyone finding me?", and that is the question home exists
 * to answer.
 *
 * Every figure comes from data the app already has. The old band's third block,
 * "Post impressions", was filled from `metrics.profile_views`, which is a
 * different number under the wrong label; it is gone. The first block was the
 * same kind of mistake (the worker's own searches as "Search appearances")
 * and now reads the analytics summary. The third block counts
 * pending *team* invitations (an organisation asking the worker to join it),
 * from the same query the invitations band below reads, and says so. It was
 * labelled plain "Invitations", which beside search appearances and profile
 * views reads as employers asking the worker to apply; nothing records those
 * yet, so that figure is not drawn until something does (#1171). The
 * prototype's shortlist count has no source either.
 */
export function HomeMetrics() {
  const { data: analytics, isLoading: loadingAnalytics } = useViewAnalytics()
  const { data: summary, isLoading: loadingSummary } = useAnalyticsSummary({ days: 30 })
  const { data: invitationData } = useMyTeamInvitations(
    { status: 'pending' },
    { staleTime: 30_000 }
  )

  if (loadingAnalytics || loadingSummary) {
    return (
      <SkeletonGroup gap={16} animation="wave">
        <Row gap={16} wrap>
          {[1, 2, 3].map((i) => (
            <Stack key={i} flex={1} minWidth={140} gap={8} paddingVertical={16}>
              <Skeleton width={100} height={12} />
              <Skeleton width={60} height={24} />
            </Stack>
          ))}
        </Row>
      </SkeletonGroup>
    )
  }

  // Search appearances are the times this worker turned up in someone else's
  // worker search: `search_impressions` rows rolled up per day by the
  // analytics job. They used to come from `useEngagementMetrics().searches`,
  // which counts searches the worker ran *themselves* (#1171).
  const searches = summary?.searchAppearances?.total
  const invitations = invitationData?.invitations?.length ?? 0

  return (
    <MetricRow bordered>
      <MetricBlock label="Search appearances" value={formatNumber(searches)} delta="Last 30 days" />
      <MetricBlock
        label="Profile views"
        value={formatNumber(analytics?.views30d)}
        delta={deltaLabel(analytics?.trend) ?? 'Last 30 days'}
        tone={deltaTone(analytics?.trend)}
      />
      <MetricBlock
        label="Team invitations"
        value={String(invitations)}
        delta={invitations > 0 ? 'Waiting on you' : 'None pending'}
        emphasis={invitations > 0}
        tone={invitations > 0 ? 'attention' : 'neutral'}
      />
    </MetricRow>
  )
}
