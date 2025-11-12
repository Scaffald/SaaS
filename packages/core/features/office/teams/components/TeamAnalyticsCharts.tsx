import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Card, Spinner, Text, YStack } from 'tamagui'

import { api } from '@app/core/utils/api'
import { BarChart, LineChart, PieChart } from '@app/ui/components/charts'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

type OverviewOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['overview']
type MetricRecord = NonNullable<OverviewOutput['metrics']>[number]
type WorkloadOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['workload']
type WorkloadSnapshot = WorkloadOutput['snapshots'][number]

interface TeamAnalyticsChartsProps {
  teamId: string
  rangeDays?: number
}

export function TeamAnalyticsCharts({ teamId, rangeDays = 30 }: TeamAnalyticsChartsProps) {
  const now = useMemo(() => new Date(), [teamId, rangeDays])

  const start = useMemo(() => {
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - (rangeDays - 1))
    startDate.setHours(0, 0, 0, 0)
    return startDate.toISOString()
  }, [now, rangeDays])

  const end = useMemo(() => {
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999)
    return endDate.toISOString()
  }, [now])

  const overviewQuery = api.teams.analytics.overview.useQuery(
    {
      teamId,
      startDate: start,
      endDate: end,
      limit: rangeDays,
    },
    {
      keepPreviousData: true,
    },
  )

  const workloadQuery = api.teams.analytics.workload.useQuery(
    {
      teamId,
      includeHistorical: false,
    },
    {
      staleTime: 60_000,
    },
  )

  const metrics = (overviewQuery.data?.metrics ?? []) as MetricRecord[]
  const workloads = (workloadQuery.data?.snapshots ?? []) as WorkloadSnapshot[]

  const applicationsTrend = useMemo((): Array<{ value: number; label: string }> => {
    if (metrics.length === 0) return []

    return [...metrics]
      .reverse()
      .map((entry) => ({
        value: Number(entry.applications?.reviewed ?? 0),
        label: new Date(entry.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      }))
  }, [metrics])

  const timeToFirstReviewTrend = useMemo((): Array<{ value: number; label: string }> => {
    if (metrics.length === 0) return []

    return [...metrics]
      .reverse()
      .map((entry) => ({
        value: Number(entry.timeToFirstReview?.averageSeconds ?? 0) / 3600,
        label: new Date(entry.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      }))
  }, [metrics])

  const workloadBreakdown = useMemo((): Array<{ text: string; value: number }> => {
    if (workloads.length === 0) return []

    return workloads
      .map((snapshot) => {
        const value =
          Number(snapshot.activeAssignments ?? 0) + Number(snapshot.pendingAssignments ?? 0)
        return {
          text: snapshot.userId?.slice(0, 6).toUpperCase() ?? 'Member',
          value,
        }
      })
      .filter((entry) => entry.value > 0)
  }, [workloads])

  const isLoading =
    overviewQuery.isLoading || workloadQuery.isLoading || overviewQuery.isFetching || workloadQuery.isFetching

  if (isLoading && metrics.length === 0) {
    return (
      <YStack gap="$3" items="center" justify="center" py="$4">
        <Spinner size="large" />
        <Text color="$color11">Loading analytics data…</Text>
      </YStack>
    )
  }

  if (metrics.length === 0) {
    return (
      <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Insights unavailable
        </Text>
        <Text color="$color11">
          We&apos;ll start charting metrics once your team begins reviewing applications and recording activity.
        </Text>
      </Card>
    )
  }

  return (
    <YStack gap="$4">
      <AnalyticsCard
        title="Applications reviewed"
        description="Recent daily totals for applications reviewed by this team."
      >
        <BarChart data={applicationsTrend} height={220} spacing={12} />
      </AnalyticsCard>

      <AnalyticsCard
        title="Average time to first review (hours)"
        description="How quickly the team responds to new applications."
      >
        <LineChart data={timeToFirstReviewTrend} height={220} />
      </AnalyticsCard>

      <AnalyticsCard
        title="Current workload distribution"
        description="Pending and active assignments across team members."
        emptyMessage="No active assignments yet."
      >
        {workloadBreakdown.length === 0 ? (
          <Text color="$color11">No workload snapshots available.</Text>
        ) : (
          <PieChart data={workloadBreakdown} radius={110} donut showValuesAsLabels textColor="#111" />
        )}
      </AnalyticsCard>
    </YStack>
  )
}

function AnalyticsCard({
  title,
  description,
  children,
  emptyMessage,
}: {
  title: string
  description?: string
  children: ReactNode
  emptyMessage?: string
}) {
  return (
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$3">
      <YStack gap="$1">
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
        {description ? (
          <Text fontSize="$3" color="$color11">
            {description}
          </Text>
        ) : null}
      </YStack>
      {emptyMessage ? <Text color="$color11">{emptyMessage}</Text> : null}
      {children}
    </Card>
  )
}


