import { Card, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { LinearChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useAnalyticsSummary, useEngagementTimeline, useAnalyticsVisitors } from '@scf/core/utils/analytics-sdk-hooks'
import { useAnalyticsSubscription } from '@scf/core/utils/supabase/useAnalyticsSubscription'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { KpiCard } from './components/KpiCard'
import { DateRangeSelector } from './components/DateRangeSelector'
import { LiveIndicator } from './components/LiveIndicator'
import { AnalyticsEmptyState } from './components/AnalyticsEmptyState'
import { AnalyticsTabBar } from './components/AnalyticsTabBar'

export function AnalyticsOverviewScreen() {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const { session } = useSessionContext()
  const userId = session?.user?.id ?? null
  const [days, setDays] = useState(30)

  // Real-time subscription
  useAnalyticsSubscription(userId)

  // Data fetching
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary({ days })
  const { data: timeline, isLoading: timelineLoading } = useEngagementTimeline({ days })
  const { data: visitors } = useAnalyticsVisitors({ days, limit: 5 })

  const hasData = summary && (summary.totalEngagement.total > 0 || summary.liveViewers > 0)

  return (
    <Stack gap={20}>
      {/* Header */}
      <Row align="center" justify="space-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Stack gap={2}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
            Analytics
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].secondary }}>
            Understand your platform exposure
          </Text>
        </Stack>
        <Row gap={12} align="center">
          <LiveIndicator count={summary?.liveViewers ?? 0} />
          <DateRangeSelector value={days} onChange={setDays} />
        </Row>
      </Row>

      {/* Tab bar */}
      <AnalyticsTabBar />

      {/* KPI Cards */}
      <Row gap={12} style={{ flexWrap: 'wrap' }}>
        <KpiCard
          title="Profile Views"
          metric={summary?.profileViews}
          isLoading={summaryLoading}
          color={colors.blue[500]}
        />
        <KpiCard
          title="Search Appearances"
          metric={summary?.searchAppearances}
          isLoading={summaryLoading}
          color={colors.green[500]}
        />
        <KpiCard
          title="Job Views"
          metric={summary?.jobViews}
          isLoading={summaryLoading}
          color={colors.purple[500]}
        />
        <KpiCard
          title="Applications"
          metric={summary?.applications}
          isLoading={summaryLoading}
          color={colors.orange[500]}
        />
      </Row>

      {!summaryLoading && !hasData ? (
        <AnalyticsEmptyState />
      ) : (
        <>
          {/* Engagement Timeline Chart */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                Engagement Over Time
              </Text>
              {timelineLoading ? (
                <Stack align="center" style={{ paddingVertical: 40 }}>
                  <Spinner size="md" />
                </Stack>
              ) : timeline?.timeline && timeline.timeline.length > 0 ? (
                <LinearChart
                  data={timeline.timeline.map((d) => d.total)}
                  labels={timeline.timeline.map((d) => {
                    const date = new Date(d.date)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  })}
                  width={undefined}
                  height={200}
                  color={colors.primary[500]}
                />
              ) : (
                <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].tertiary, textAlign: 'center', paddingVertical: 40 }}>
                  No engagement data for this period
                </Text>
              )}
            </Stack>
          </Card>

          {/* Recent Visitors */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Row align="center" justify="space-between">
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                  Recent Visitors
                </Text>
                <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].tertiary }}>
                  {visitors?.total ?? 0} total
                </Text>
              </Row>
              {visitors?.visitors && visitors.visitors.length > 0 ? (
                <Stack gap={8}>
                  {visitors.visitors.map((v, i) => (
                    <Row key={`${v.viewerId}-${i}`} gap={12} align="center" style={styles.visitorRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.bg[resolvedTheme].muted }]}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[resolvedTheme].secondary }}>
                          {(v.viewerName || '?')[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[resolvedTheme].primary }}>
                          {v.viewerName || 'Anonymous'}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].tertiary }}>
                          {v.viewerHeadline || v.roleType || 'Profile viewer'}
                        </Text>
                      </Stack>
                      <Text style={{ fontSize: 11, color: colors.text[resolvedTheme].tertiary }}>
                        {formatTimeAgo(new Date(v.viewedAt))}
                      </Text>
                    </Row>
                  ))}
                </Stack>
              ) : (
                <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].tertiary, textAlign: 'center', paddingVertical: 20 }}>
                  No visitors yet
                </Text>
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  )
}

function formatTimeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

const styles = StyleSheet.create({
  visitorRow: {
    paddingVertical: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
