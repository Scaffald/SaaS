import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { type ReactNode, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

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
    <YStack gap="$3">
      <XStack gap="$2" alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Text fontSize="$6" fontWeight="700">
          Analytics summary
        </Text>
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          <ResponsiveSelect
            value={String(range)}
            onValueChange={(value) => setRange(Number(value))}
            placeholder="Select range"
            size="$2"
            options={RANGE_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
          />
          <Button
            size="$2"
            variant="outlined"
            icon={RefreshCw}
            onPress={() => void analyticsQuery.refetch()}
            disabled={analyticsQuery.isFetching}
          >
            Refresh
          </Button>
        </XStack>
      </XStack>

      {analyticsQuery.isLoading ? (
        <YStack alignItems="center" justifyContent="center" paddingVertical="$4" gap="$2">
          <Spinner size="large" />
          <Text color="$color11">Loading analytics…</Text>
        </YStack>
      ) : metrics.length === 0 ? (
        <YStack gap="$2">
          <Text fontWeight="600">No analytics yet</Text>
          <Text color="$color11">
            Metrics will appear once the team starts reviewing invitations and applications.
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          <XStack gap="$3" flexWrap="wrap">
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
          </XStack>
          {trendDescription ? (
            <Text fontSize="$3" color="$color10">
              {trendDescription}
            </Text>
          ) : null}
        </YStack>
      )}
    </YStack>
  )
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <YStack
      gap="$1"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      paddingHorizontal="$3"
      paddingVertical="$2"
      backgroundColor="$color2"
      style={{ minWidth: 140 }}
    >
      <Text fontSize="$2" color="$color10" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="$5" fontWeight="700">
        {children}
      </Text>
    </YStack>
  )
}
