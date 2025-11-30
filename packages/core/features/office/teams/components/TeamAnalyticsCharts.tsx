import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { BarChart, LineChart, PieChart } from '@scaffald/tamagui-ui'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { Card, Spinner, Text, YStack } from 'tamagui'

type OverviewOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['overview']
type MetricRecord = NonNullable<OverviewOutput['metrics']>[number]
type WorkloadOutput = inferRouterOutputs<AppRouter>['teams']['analytics']['workload']
type WorkloadSnapshot = WorkloadOutput['snapshots'][number]

interface TeamAnalyticsChartsProps {
  teamId: string
  rangeDays?: number
}

export function TeamAnalyticsCharts({ teamId, rangeDays = 30 }: TeamAnalyticsChartsProps) {
  const { width } = useWindowDimensions() // Keep for actual dimension calculations
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const isSmallScreen = width <= 800
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
      placeholderData: (previousData) => previousData,
    }
  )

  const workloadQuery = api.teams.analytics.workload.useQuery(
    {
      teamId,
      includeHistorical: false,
    },
    {
      staleTime: 60_000,
    }
  )

  const metrics = (overviewQuery.data?.metrics ?? []) as MetricRecord[]
  const workloads = (workloadQuery.data?.snapshots ?? []) as WorkloadSnapshot[]

  const applicationsTrend = useMemo((): Array<{ value: number; label: string }> => {
    if (metrics.length === 0) return []

    return [...metrics].reverse().map((entry) => ({
      value: Number(entry.applications?.reviewed ?? 0),
      label: new Date(entry.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    }))
  }, [metrics])

  const timeToFirstReviewTrend = useMemo((): Array<{ value: number; label: string }> => {
    if (metrics.length === 0) return []

    return [...metrics].reverse().map((entry) => ({
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

  const applicationsSummary = useMemo(() => {
    if (applicationsTrend.length === 0) {
      return null
    }
    const totalReviewed = applicationsTrend.reduce((sum, point) => sum + point.value, 0)
    const latestPoint = applicationsTrend[applicationsTrend.length - 1]
    const peakPoint = applicationsTrend.reduce(
      (prev, point) => (point.value > prev.value ? point : prev),
      applicationsTrend[0]
    )

    return `Reviewed ${totalReviewed} applications over the past ${applicationsTrend.length} days. Latest day ${latestPoint.label} recorded ${latestPoint.value} reviews, while the peak day ${peakPoint.label} reached ${peakPoint.value}.`
  }, [applicationsTrend])

  const timeToFirstReviewSummary = useMemo(() => {
    if (timeToFirstReviewTrend.length === 0) {
      return null
    }
    const values = timeToFirstReviewTrend.map((point) => point.value)
    const averageHours = values.reduce((sum, hours) => sum + hours, 0) / values.length
    const latestPoint = timeToFirstReviewTrend[timeToFirstReviewTrend.length - 1]

    return `Average first-review time is ${averageHours.toFixed(1)} hours across the last ${timeToFirstReviewTrend.length} days. The most recent reading on ${latestPoint.label} was ${latestPoint.value.toFixed(1)} hours.`
  }, [timeToFirstReviewTrend])

  const workloadSummary = useMemo(() => {
    if (workloadBreakdown.length === 0) {
      return null
    }
    const totalAssignments = workloadBreakdown.reduce((sum, entry) => sum + entry.value, 0)
    const busiestMember = workloadBreakdown.reduce(
      (prev, entry) => (entry.value > prev.value ? entry : prev),
      workloadBreakdown[0]
    )

    return `Team members are handling ${totalAssignments} active or pending assignments. ${busiestMember.text} currently has the highest workload with ${busiestMember.value} assignments.`
  }, [workloadBreakdown])

  const isLoading =
    overviewQuery.isLoading ||
    workloadQuery.isLoading ||
    overviewQuery.isFetching ||
    workloadQuery.isFetching

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
          We&apos;ll start charting metrics once your team begins reviewing applications and
          recording activity.
        </Text>
      </Card>
    )
  }

  return (
    <YStack gap="$4">
      <AnalyticsCard
        title="Applications reviewed"
        description="Recent daily totals for applications reviewed by this team."
        summary={applicationsSummary ?? undefined}
      >
        <ScrollView
          horizontal={isSmallScreen}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            isSmallScreen ? { paddingVertical: 8, paddingRight: 24 } : undefined
          }
        >
          <YStack
            gap="$2"
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Applications reviewed bar chart for the past ${applicationsTrend.length} days`}
            accessibilityHint={applicationsSummary ?? undefined}
            style={isSmallScreen ? { minWidth: Math.max(width - 48, 320) } : undefined}
          >
            <BarChart
              data={applicationsTrend}
              height={220}
              spacing={isSmallScreen ? 16 : 12}
              width={isSmallScreen ? Math.max(width - 80, 360) : undefined}
            />
          </YStack>
        </ScrollView>
      </AnalyticsCard>

      <AnalyticsCard
        title="Average time to first review (hours)"
        description="How quickly the team responds to new applications."
        summary={timeToFirstReviewSummary ?? undefined}
      >
        <ScrollView
          horizontal={isSmallScreen}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            isSmallScreen ? { paddingVertical: 8, paddingRight: 24 } : undefined
          }
        >
          <YStack
            gap="$2"
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Average time to first review line chart for the past ${timeToFirstReviewTrend.length} days`}
            accessibilityHint={timeToFirstReviewSummary ?? undefined}
            style={isSmallScreen ? { minWidth: Math.max(width - 48, 320) } : undefined}
          >
            <LineChart
              data={timeToFirstReviewTrend}
              height={220}
              width={isSmallScreen ? Math.max(width - 80, 360) : undefined}
            />
          </YStack>
        </ScrollView>
      </AnalyticsCard>

      <AnalyticsCard
        title="Current workload distribution"
        description="Pending and active assignments across team members."
        emptyMessage="No active assignments yet."
        summary={workloadSummary ?? undefined}
      >
        {workloadBreakdown.length === 0 ? (
          <Text color="$color11">No workload snapshots available.</Text>
        ) : (
          <ScrollView
            horizontal={isSmallScreen}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              isSmallScreen ? { paddingVertical: 8, paddingRight: 24 } : undefined
            }
          >
            <YStack
              gap="$2"
              accessible
              accessibilityRole="image"
              accessibilityLabel="Donut chart of active and pending assignments per team member"
              accessibilityHint={workloadSummary ?? undefined}
              style={isSmallScreen ? { minWidth: Math.max(width - 48, 320) } : undefined}
            >
              <PieChart
                data={workloadBreakdown}
                radius={isSmallScreen ? 100 : 110}
                donut
                showValuesAsLabels
                textColor="#111"
              />
              <YStack gap="$1">
                {workloadBreakdown.map((entry) => (
                  <Text key={entry.text} fontSize="$2" color="$color11">
                    {entry.text}: {entry.value} assignments
                  </Text>
                ))}
              </YStack>
            </YStack>
          </ScrollView>
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
  summary,
}: {
  title: string
  description?: string
  children: ReactNode
  emptyMessage?: string
  summary?: string
}) {
  return (
    <Card borderWidth={1} borderColor="$borderColor" bg="$color2" p="$4" gap="$3">
      <YStack gap="$1">
        <Text fontSize="$6" fontWeight="700" accessibilityRole="header">
          {title}
        </Text>
        {description ? (
          <Text fontSize="$3" color="$color11">
            {description}
          </Text>
        ) : null}
        {summary ? (
          <Text fontSize="$2" color="$color11">
            {summary}
          </Text>
        ) : null}
      </YStack>
      {emptyMessage ? <Text color="$color11">{emptyMessage}</Text> : null}
      {children}
    </Card>
  )
}
