import { Card, Row, Spinner, Stack, Text, useThemeContext } from '@scaffald/ui'
import { BarChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useSearchKeywords, useSearchTimeline } from '@scf/core/utils/analytics-sdk-hooks'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { DateRangeSelector } from './components/DateRangeSelector'
import { AnalyticsTabBar } from './components/AnalyticsTabBar'
import { AnalyticsEmptyState } from './components/AnalyticsEmptyState'

export function SearchScreen() {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const [days, setDays] = useState(30)

  const { data: keywords, isLoading: keywordsLoading } = useSearchKeywords({ days, limit: 20 })
  const { data: searchTimeline, isLoading: timelineLoading } = useSearchTimeline({ days })

  const hasKeywords = keywords?.keywords && keywords.keywords.length > 0
  const hasTimeline = searchTimeline?.timeline && searchTimeline.timeline.length > 0

  return (
    <Stack gap={20}>
      {/* Header */}
      <Row align="center" justify="space-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Stack gap={2}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
            Search Analytics
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[resolvedTheme].secondary }}>
            Keywords and search queries that surface your profile
          </Text>
        </Stack>
        <DateRangeSelector value={days} onChange={setDays} />
      </Row>

      <AnalyticsTabBar />

      {keywordsLoading && timelineLoading ? (
        <Stack align="center" style={{ paddingVertical: 60 }}>
          <Spinner size="lg" />
        </Stack>
      ) : !hasKeywords && !hasTimeline ? (
        <AnalyticsEmptyState
          title="No search data"
          message="Search analytics appear when your profile is discovered through platform search. Complete your profile and add skills to increase visibility."
        />
      ) : (
        <>
          {/* Search Timeline */}
          {hasTimeline ? (
            <Card variant="outlined" radius="lg" padding="lg">
              <Stack gap={12}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                  Search Appearances
                </Text>
                <BarChart
                  data={searchTimeline?.timeline.map((d) => d.impressions) ?? []}
                  labels={searchTimeline?.timeline.map((d) => {
                    const date = new Date(d.date)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  })}
                  width={undefined}
                  height={200}
                  color={colors.blue[500]}
                />
              </Stack>
            </Card>
          ) : null}

          {/* Top Keywords Table */}
          {hasKeywords ? (
            <Card variant="outlined" radius="lg" padding="lg">
              <Stack gap={12}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text[resolvedTheme].primary }}>
                  Top Search Keywords
                </Text>

                {/* Table header */}
                <Row style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.keywordCol, { color: colors.text[resolvedTheme].tertiary }]}>
                    Keyword
                  </Text>
                  <Text style={[styles.headerCell, styles.numCol, { color: colors.text[resolvedTheme].tertiary }]}>
                    Impressions
                  </Text>
                  <Text style={[styles.headerCell, styles.numCol, { color: colors.text[resolvedTheme].tertiary }]}>
                    Clicks
                  </Text>
                  <Text style={[styles.headerCell, styles.numCol, { color: colors.text[resolvedTheme].tertiary }]}>
                    CTR
                  </Text>
                  <Text style={[styles.headerCell, styles.numCol, { color: colors.text[resolvedTheme].tertiary }]}>
                    Avg Pos
                  </Text>
                </Row>

                {/* Table rows */}
                {keywords?.keywords.map((kw, i) => (
                  <View key={kw.query}>
                    {i > 0 ? (
                      <View style={{ height: 1, backgroundColor: colors.border[resolvedTheme].default }} />
                    ) : null}
                    <Row style={styles.tableRow}>
                      <Text
                        numberOfLines={1}
                        style={[styles.cell, styles.keywordCol, { color: colors.text[resolvedTheme].primary, fontWeight: '500' }]}
                      >
                        {kw.query}
                      </Text>
                      <Text style={[styles.cell, styles.numCol, { color: colors.text[resolvedTheme].primary }]}>
                        {kw.impressions.toLocaleString()}
                      </Text>
                      <Text style={[styles.cell, styles.numCol, { color: colors.text[resolvedTheme].primary }]}>
                        {kw.clicks.toLocaleString()}
                      </Text>
                      <Text style={[styles.cell, styles.numCol, { color: colors.text[resolvedTheme].primary }]}>
                        {kw.ctr}%
                      </Text>
                      <Text style={[styles.cell, styles.numCol, { color: colors.text[resolvedTheme].primary }]}>
                        #{kw.avgPosition}
                      </Text>
                    </Row>
                  </View>
                ))}
              </Stack>
            </Card>
          ) : null}
        </>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  tableHeader: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tableRow: {
    paddingVertical: 10,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cell: {
    fontSize: 13,
  },
  keywordCol: {
    flex: 2,
  },
  numCol: {
    flex: 1,
    textAlign: 'right',
  },
})
