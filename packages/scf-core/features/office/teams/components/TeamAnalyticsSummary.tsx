import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCw } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { type ReactNode, useMemo, useState } from 'react'
import { ResponsiveSelect, useThemeContext } from '@scaffald/ui'
import { Button, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface TeamAnalyticsSummaryProps {
  teamId: string
}

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
]

type TeamAnalyticsOverviewOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['overview']
type TeamDailyMetric = NonNullable<TeamAnalyticsOverviewOutput['metrics']>[number]

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) {
    return '—'
  }
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat().format(value)
}

export function TeamAnalyticsSummary({ teamId }: TeamAnalyticsSummaryProps) {
  const { theme } = useThemeContext()
  const [range, setRange] = useState<number>(7)

  const now = useMemo(() => new Date(), [])
  const startDateIso = useMemo(() => {
    const start = new Date(now)
    start.setDate(start.getDate() - (range - 1))
    start.setHours(0, 0, 0, 0)
    return start.toISOString()
  }, [now, range])

  const endDateIso = useMemo(() => {
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return end.toISOString()
  }, [now])

  const analyticsQuery = api.teams.analytics.overview.useQuery(
    {
      teamId,
      startDate: startDateIso,
      endDate: endDateIso,
      limit: range,
    },
    {
      placeholderData: (previousData) => previousData,
    }
  )

  const metrics = (analyticsQuery.data?.metrics ?? []) as TeamDailyMetric[]
  const latest = metrics[0]

  const membersActiveAvg = metrics.length
    ? Math.round(
        metrics.reduce(
          (sum: number, day: TeamDailyMetric) => sum + Number(day.members?.active ?? 0),
          0
        ) / metrics.length
      )
    : undefined

  const jobsActiveLatest = latest?.jobs?.active ?? undefined
  const pendingInvitationsLatest = latest?.invitations?.pending ?? undefined
  const workloadPressureLatest = latest?.workloadPressureScore ?? undefined

  const totalApplicationsReviewed = metrics.reduce(
    (sum: number, day: TeamDailyMetric) => sum + Number(day.applications?.reviewed ?? 0),
    0
  )

  const reviewTimeSamples = metrics
    .map((day: TeamDailyMetric) => day.timeToFirstReview?.averageSeconds)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  const avgTimeToFirstReviewSeconds = reviewTimeSamples.length
    ? Math.round(
        reviewTimeSamples.reduce((sum: number, value: number) => sum + value, 0) /
          reviewTimeSamples.length
      )
    : null

  const trendDescription =
    metrics.length > 1 && latest?.applications?.reviewed !== undefined
      ? (() => {
          const previous = metrics[1]?.applications?.reviewed ?? 0
          const delta = Number(latest.applications.reviewed ?? 0) - Number(previous)
          if (delta === 0) return 'Flat compared to the prior day'
          if (delta > 0) return `Up ${delta} vs. prior day`
          return `Down ${Math.abs(delta)} vs. prior day`
        })()
      : null

  return (
    <Stack gap={12}>
      <Row gap={8} align="center" justify="space-between" flexWrap="wrap">
        <Text>Analytics summary</Text>
        <Row gap={8} align="center" flexWrap="wrap">
          <ResponsiveSelect
            value={String(range)}
            onValueChange={(value) => setRange(Number(value))}
            placeholder="Select range"
            size="xs"
            options={RANGE_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
          />
          <Button
            size="xs"
            variant="outline"
            iconStart={RefreshCw}
            onPress={() => void analyticsQuery.refetch()}
            disabled={analyticsQuery.isFetching}
          >
            Refresh
          </Button>
        </Row>
      </Row>

      {analyticsQuery.isLoading ? (
        <Stack align="center" justify="center" paddingVertical={16} gap={8}>
          <Spinner size="lg" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading analytics…</Text>
        </Stack>
      ) : metrics.length === 0 ? (
        <Stack gap={8}>
          <Text>No analytics yet</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Metrics will appear once the team starts reviewing invitations and applications.
          </Text>
        </Stack>
      ) : (
        <Stack gap={12}>
          <Row gap={12} flexWrap="wrap">
            <StatTile label="Active members (avg)">{formatNumber(membersActiveAvg)}</StatTile>
            <StatTile label="Active jobs (latest)">{formatNumber(jobsActiveLatest)}</StatTile>
            <StatTile label="Applications reviewed">
              {formatNumber(totalApplicationsReviewed)}
            </StatTile>
            <StatTile label="Pending invitations">
              {formatNumber(pendingInvitationsLatest)}
            </StatTile>
            <StatTile label="Avg. time to first review">
              {formatDuration(avgTimeToFirstReviewSeconds)}
            </StatTile>
            <StatTile label="Workload pressure">
              {workloadPressureLatest !== undefined && workloadPressureLatest !== null
                ? workloadPressureLatest.toFixed(2)
                : '—'}
            </StatTile>
          </Row>
          {trendDescription ? (
            <Text style={{ color: colors.text[theme].secondary }}>{trendDescription}</Text>
          ) : null}
        </Stack>
      )}
    </Stack>
  )
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  const { theme } = useThemeContext()
  return (
    <Stack
      gap={4}
      borderWidth={1}
      borderColor={colors.border[theme].default}
      borderRadius={16}
      paddingHorizontal={12}
      paddingVertical={8}
      style={{ backgroundColor: colors.bg[theme].subtle, minWidth: 140 }}
    >
      <Text style={{ color: colors.text[theme].secondary }} textTransform="uppercase">
        {label}
      </Text>
      <Text>{children}</Text>
    </Stack>
  )
}
