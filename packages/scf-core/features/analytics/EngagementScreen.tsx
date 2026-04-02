import { Card, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { LinearChart, DonutChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useEngagementTimeline, useAnalyticsVisitors } from '@scf/core/utils/analytics-sdk-hooks'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { DateRangeSelector } from './components/DateRangeSelector'
import { AnalyticsTabBar } from './components/AnalyticsTabBar'
import { AnalyticsEmptyState } from './components/AnalyticsEmptyState'

export function EngagementScreen() {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const [days, setDays] = useState(30)

  const { data: timeline, isLoading: timelineLoading } = useEngagementTimeline({ days })
  const { data: visitors, isLoading: visitorsLoading } = useAnalyticsVisitors({ days, limit: 20 })

  const hasTimeline = timeline?.timeline && timeline.timeline.length > 0

  // Build event type breakdown
  const eventBreakdown = timeline?.timeline?.reduce(
    (acc, d) => {
      acc.profileViews += d.profileViews
      acc.jobViews += d.jobViews
      acc.applications += d.applications
      acc.searches += d.searches
      return acc
    },
    { profileViews: 0, jobViews: 0, applications: 0, searches: 0 }
  )

  const donutData =
    eventBreakdown
      ? [
          { label: 'Profile Views', value: eventBreakdown.profileViews, color: colors.blue[500] },
          { label: 'Job Views', value: eventBreakdown.jobViews, color: colors.purple[500] },
          { label: 'Applications', value: eventBreakdown.applications, color: colors.orange[500] },
          { label: 'Searches', value: eventBreakdown.searches, color: colors.green[500] },
        ].filter((d) => d.value > 0)
      : []

  return (
    <Stack gap={20}>
      {/* Header */}
      <Row align="center" justify="space-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Stack gap={2}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
            Engagement
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].secondary }}>
            How users interact with your profile
          </Text>
        </Stack>
        <DateRangeSelector value={days} onChange={setDays} />
      </Row>

      <AnalyticsTabBar />

      {timelineLoading ? (
        <Stack align="center" style={{ paddingVertical: 60 }}>
          <Spinner size="lg" />
        </Stack>
      ) : !hasTimeline ? (
        <AnalyticsEmptyState
          title="No engagement data"
          message="Engagement data will appear as users interact with your profile, jobs, and applications."
        />
      ) : (
        <>
          {/* Timeline Chart */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                Engagement Timeline
              </Text>
              <LinearChart
                data={timeline.timeline.map((d) => {
                  const date = new Date(d.date)
                  return {
                    x: `${date.getMonth() + 1}/${date.getDate()}`,
                    y: d.total,
                  }
                })}
                height={220}
                color={colors.primary[500]}
              />
            </Stack>
          </Card>

          {/* Event Type Breakdown */}
          {donutData.length > 0 ? (
            <Card variant="outlined" radius="lg" padding="lg">
              <Stack gap={12}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                  Event Breakdown
                </Text>
                <Row gap={20} align="center" justify="center" style={{ flexWrap: 'wrap' }}>
                  <DonutChart
                    data={donutData.map((d) => ({
                      label: d.label,
                      value: d.value,
                      color: d.color,
                    }))}
                    size="lg"
                  />
                  <Stack gap={8}>
                    {donutData.map((d) => (
                      <Row key={d.label} gap={8} align="center">
                        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: d.color }} />
                        <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].primary }}>
                          {d.label}: {d.value.toLocaleString()}
                        </Text>
                      </Row>
                    ))}
                  </Stack>
                </Row>
              </Stack>
            </Card>
          ) : null}

          {/* Visitors */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Row align="center" justify="space-between">
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                  Profile Visitors
                </Text>
                <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].tertiary }}>
                  {visitors?.total ?? 0} in {days}d
                </Text>
              </Row>

              {visitorsLoading ? (
                <Spinner size="md" />
              ) : visitors?.visitors && visitors.visitors.length > 0 ? (
                <Stack gap={6}>
                  {visitors.visitors.map((v, i) => (
                    <Row key={`${v.viewerId}-${i}`} gap={12} align="center" style={styles.visitorRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.bg[resolvedTheme].muted }]}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[resolvedTheme].secondary }}>
                          {(v.viewerName || '?')[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <Stack gap={1} style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[resolvedTheme].primary }}>
                          {v.viewerName || 'Anonymous'}
                        </Text>
                        <Row gap={8}>
                          {v.roleType ? (
                            <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].tertiary }}>
                              {v.roleType}
                            </Text>
                          ) : null}
                          {v.industryName ? (
                            <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].tertiary }}>
                              {v.industryName}
                            </Text>
                          ) : null}
                        </Row>
                      </Stack>
                      <Text style={{ fontSize: 11, color: colors.text[resolvedTheme].tertiary }}>
                        {new Date(v.viewedAt).toLocaleDateString()}
                      </Text>
                    </Row>
                  ))}
                </Stack>
              ) : (
                <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].tertiary, textAlign: 'center', paddingVertical: 20 }}>
                  No visitors in this period
                </Text>
              )}

              {/* Industry breakdown */}
              {visitors?.byIndustry && visitors.byIndustry.length > 0 ? (
                <Stack gap={8}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[resolvedTheme].primary, marginTop: 8 }}>
                    By Industry
                  </Text>
                  {visitors.byIndustry.slice(0, 5).map((b) => (
                    <Row key={b.industry} align="center" justify="space-between">
                      <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].secondary }}>{b.industry}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>{b.count}</Text>
                    </Row>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  visitorRow: {
    paddingVertical: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
