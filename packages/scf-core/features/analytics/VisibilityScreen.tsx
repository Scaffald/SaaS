import { Card, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { LinearChart, CircleChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useVisibilityTimeline } from '@scf/core/utils/analytics-sdk-hooks'
import { useState, useMemo } from 'react'

import { DateRangeSelector } from './components/DateRangeSelector'
import { AnalyticsTabBar } from './components/AnalyticsTabBar'
import { AnalyticsEmptyState } from './components/AnalyticsEmptyState'

export function VisibilityScreen() {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const [days, setDays] = useState(30)

  const { data: visibility, isLoading } = useVisibilityTimeline({ days })

  const hasData = visibility?.timeline && visibility.timeline.length > 0

  const totals = useMemo(() => {
    if (!visibility?.timeline) return { impressions: 0, clicks: 0, ctr: 0, searchResults: 0, recommendations: 0, feedAppearances: 0 }
    return visibility.timeline.reduce(
      (acc, d) => {
        acc.impressions += d.searchResults + d.recommendations + d.feedAppearances
        acc.clicks += d.clicks
        acc.searchResults += d.searchResults
        acc.recommendations += d.recommendations
        acc.feedAppearances += d.feedAppearances
        return acc
      },
      { impressions: 0, clicks: 0, ctr: 0, searchResults: 0, recommendations: 0, feedAppearances: 0 }
    )
  }, [visibility])

  const ctr = totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 10000) / 100 : 0

  return (
    <Stack gap={20}>
      {/* Header */}
      <Row align="center" justify="space-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Stack gap={2}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
            Visibility
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].secondary }}>
            How often you appear in searches and recommendations
          </Text>
        </Stack>
        <DateRangeSelector value={days} onChange={setDays} />
      </Row>

      <AnalyticsTabBar />

      {isLoading ? (
        <Stack align="center" style={{ paddingVertical: 60 }}>
          <Spinner size="lg" />
        </Stack>
      ) : !hasData ? (
        <AnalyticsEmptyState
          title="No visibility data"
          message="Visibility data appears when your profile shows up in search results and recommendations."
        />
      ) : (
        <>
          {/* Summary metrics */}
          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            <Card variant="outlined" radius="lg" padding="md" style={{ flex: 1, minWidth: 140 }}>
              <Stack gap={4}>
                <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary, fontWeight: '500' }}>
                  Total Impressions
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
                  {totals.impressions.toLocaleString()}
                </Text>
              </Stack>
            </Card>
            <Card variant="outlined" radius="lg" padding="md" style={{ flex: 1, minWidth: 140 }}>
              <Stack gap={4}>
                <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary, fontWeight: '500' }}>
                  Clicks
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
                  {totals.clicks.toLocaleString()}
                </Text>
              </Stack>
            </Card>
            <Card variant="outlined" radius="lg" padding="md" style={{ flex: 1, minWidth: 140 }}>
              <Stack gap={4} align="center">
                <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary, fontWeight: '500' }}>
                  Click-Through Rate
                </Text>
                <CircleChart
                  value={ctr}
                  maxValue={100}
                  size={80}
                  color={colors.green[500]}
                  label={`${ctr}%`}
                />
              </Stack>
            </Card>
          </Row>

          {/* Impressions Timeline */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                Impressions Over Time
              </Text>
              <LinearChart
                data={visibility?.timeline.map((d) => d.searchResults + d.recommendations + d.feedAppearances) ?? []}
                labels={visibility?.timeline.map((d) => {
                  const date = new Date(d.date)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                })}
                width={undefined}
                height={200}
                color={colors.green[500]}
              />
            </Stack>
          </Card>

          {/* Breakdown by type */}
          <Card variant="outlined" radius="lg" padding="lg">
            <Stack gap={12}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                Impression Sources
              </Text>
              {[
                { label: 'Search Results', value: totals.searchResults, color: colors.blue[500] },
                { label: 'Recommendations', value: totals.recommendations, color: colors.purple[500] },
                { label: 'Feed Appearances', value: totals.feedAppearances, color: colors.orange[500] },
              ]
                .filter((s) => s.value > 0)
                .map((source) => (
                  <Row key={source.label} align="center" justify="space-between">
                    <Row gap={8} align="center">
                      <Stack
                        style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: source.color }}
                      />
                      <Text style={{ fontSize: 14, color: colors.text[resolvedTheme].primary }}>{source.label}</Text>
                    </Row>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                      {source.value.toLocaleString()}
                    </Text>
                  </Row>
                ))}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  )
}
