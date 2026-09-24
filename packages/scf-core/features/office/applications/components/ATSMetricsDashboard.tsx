/**
 * ATS Metrics Dashboard — Basic hiring funnel analytics.
 * Shows pipeline funnel, stage distribution, conversion rates,
 * source-of-hire tracking, and time-to-hire reporting.
 *
 * @see Issue #90 (Basic Metrics Dashboard)
 * @see Issue #91 (Source-of-Hire Tracking)
 * @see Issue #92 (Time-to-Hire Reporting)
 */

import { useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import {
  H3,
  MetricBlock,
  MetricRow,
  ResponsiveSelect,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus, ATSApplication } from '../types'

/** Pipeline stage display config */
/**
 * Series colours (§12 #16).
 *
 * These were hardcoded hex — a Tailwind-ish palette that belongs to no theme
 * and no token file, so the charts kept indigo/violet/amber bars on a warm
 * stone light theme AND on a near-black dark one. The dark-mode versions in
 * particular sat at whatever contrast they happened to land on.
 *
 * They read from the token ramps now and are resolved per theme. Stage order
 * carries progression — cool at the top of the funnel, warm at the decision
 * points, terracotta at the terminal stage — rather than being seven unrelated
 * hues, so a reader can tell direction from colour alone.
 */
const pipelineStages = (
  theme: 'light' | 'dark'
): Array<{ key: ApplicationStatus; label: string; color: string }> => {
  // Dark themes need the lighter end of each ramp to hold contrast against a
  // near-black ground; light themes need the darker end.
  const step = theme === 'light' ? 600 : 300
  return [
    { key: 'new', label: 'New', color: colors.info[step] },
    { key: 'screen', label: 'Screening', color: colors.primary[step] },
    { key: 'inquired', label: 'Inquiry', color: colors.violet[step] },
    { key: 'interview', label: 'Interview', color: colors.blue[step] },
    { key: 'offer', label: 'Offer', color: colors.warning[step] },
    { key: 'hired', label: 'Hired', color: colors.success[step] },
    { key: 'rejected', label: 'Rejected', color: colors.error[step] },
  ]
}

/** Source categories for hire tracking */
export type HireSource =
  | 'scaffald'
  | 'referral'
  | 'external_board'
  | 'social_media'
  | 'company_website'
  | 'other'

const SOURCE_LABELS: Record<HireSource, string> = {
  scaffald: 'Scaffald',
  referral: 'Referral',
  external_board: 'External Board',
  social_media: 'Social Media',
  company_website: 'Company Website',
  other: 'Other',
}

const sourceColors = (theme: 'light' | 'dark'): Record<HireSource, string> => {
  const step = theme === 'light' ? 600 : 300
  return {
    scaffald: colors.primary[step],
    referral: colors.success[step],
    external_board: colors.warning[step],
    social_media: colors.blue[step],
    company_website: colors.violet[step],
    other: colors.gray[theme === 'light' ? 500 : 400],
  }
}

interface ATSMetricsDashboardProps {
  applications: ATSApplication[]
  isLoading?: boolean
}

/** Calculate days between two ISO dates */
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * When the hire was actually recorded.
 *
 * Returns null when no `hired` transition exists, which is the honest answer
 * for a record that predates the activity log — callers decide what to do
 * rather than being handed a plausible wrong date.
 *
 * `updatedAt` is not this. It moves on any edit — a note, an assignment, a
 * screening tweak — so it drifts further from the hire the longer the record
 * lives, and it was what time-to-hire measured.
 */
export function hiredAtFrom(
  stageHistory: ATSApplication['stageHistory'] | undefined
): string | null {
  const hires = (stageHistory ?? []).filter((change) => change.toStage === 'hired')
  if (hires.length === 0) return null

  // Last one wins: a re-hire after a reversal is the hire that counts.
  return hires.reduce((latest, change) =>
    Date.parse(change.changedAt) > Date.parse(latest.changedAt) ? change : latest
  ).changedAt
}

/** Days from application to hire, or null when the hire is not recorded. */
export function timeToHireDays(app: ATSApplication): number | null {
  const hiredAt = hiredAtFrom(app.stageHistory)
  return hiredAt ? daysBetween(app.appliedAt, hiredAt) : null
}

export function ATSMetricsDashboard({ applications, isLoading = false }: ATSMetricsDashboardProps) {
  const { theme } = useThemeContext()
  const PIPELINE_STAGES = useMemo(() => pipelineStages(theme), [theme])
  const SOURCE_COLORS = useMemo(() => sourceColors(theme), [theme])
  const [dateRange, setDateRange] = useState<number>(30)

  // Filter applications by date range
  const filteredApps = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - dateRange)
    return applications.filter((app) => new Date(app.appliedAt) >= cutoff)
  }, [applications, dateRange])

  // ─── Stage Distribution ─────────────────────────────────
  const stageDistribution = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      new: 0,
      screen: 0,
      inquired: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
      // Counted separately from rejected on purpose: a candidate who
      // pulled out is not one the employer turned down, and conflating
      // them skews both conversion and EEO adverse-impact ratios (#533).
      withdrawn: 0,
    }
    for (const app of filteredApps) {
      counts[app.status] = (counts[app.status] || 0) + 1
    }
    return counts
  }, [filteredApps])

  // ─── Conversion Rates ─────────────────────────────────
  const conversionRates = useMemo(() => {
    const total = filteredApps.length
    if (total === 0) return []

    const funnelOrder: ApplicationStatus[] = [
      'new',
      'screen',
      'inquired',
      'interview',
      'offer',
      'hired',
    ]
    const cumulative: Array<{ stage: string; count: number; rate: number }> = []

    for (let i = 0; i < funnelOrder.length; i++) {
      const stage = funnelOrder[i]
      // Count apps that reached this stage or beyond
      const reached = filteredApps.filter((app) => {
        const appIdx = funnelOrder.indexOf(app.status)
        // rejected can come from any stage, count by stage history if available
        if (app.status === 'rejected') {
          // Use stageHistory if available, otherwise count as screened
          if (app.stageHistory && app.stageHistory.length > 0) {
            const maxStage = Math.max(
              ...app.stageHistory.map((h) => funnelOrder.indexOf(h.toStage as ApplicationStatus))
            )
            return maxStage >= i
          }
          return i <= 1 // Default: rejected apps counted in new and screen
        }
        return appIdx >= i
      }).length

      cumulative.push({
        stage: PIPELINE_STAGES.find((s) => s.key === stage)?.label || stage,
        count: reached,
        rate: Math.round((reached / total) * 100),
      })
    }

    return cumulative
  }, [filteredApps, PIPELINE_STAGES])

  // ─── Source of Hire (Issue #91) ─────────────────────────
  const sourceDistribution = useMemo(() => {
    const sources: Record<HireSource, number> = {
      scaffald: 0,
      referral: 0,
      external_board: 0,
      social_media: 0,
      company_website: 0,
      other: 0,
    }

    for (const app of filteredApps) {
      const src = (app.source as HireSource) || 'scaffald'
      sources[src] = (sources[src] || 0) + 1
    }

    return Object.entries(sources)
      .filter(([, count]) => count > 0)
      .map(([source, count]) => ({
        source: source as HireSource,
        label: SOURCE_LABELS[source as HireSource],
        count,
        percentage: filteredApps.length > 0 ? Math.round((count / filteredApps.length) * 100) : 0,
        color: SOURCE_COLORS[source as HireSource],
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredApps, SOURCE_COLORS])

  // ─── Time-to-Hire (Issue #92) ─────────────────────────
  const timeToHireStats = useMemo(() => {
    const hiredApps = filteredApps.filter((app) => app.status === 'hired')

    if (hiredApps.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0, count: 0, distribution: [] }
    }

    // Falls back to updatedAt only for hires that predate the activity log.
    const durations = hiredApps.map(
      (app) => timeToHireDays(app) ?? daysBetween(app.appliedAt, app.updatedAt)
    )

    durations.sort((a, b) => a - b)
    const sum = durations.reduce((s, d) => s + d, 0)
    const avg = Math.round(sum / durations.length)
    const median = durations[Math.floor(durations.length / 2)]
    const min = durations[0]
    const max = durations[durations.length - 1]

    // Distribution buckets
    const buckets = [
      { label: '0-7 days', min: 0, max: 7, count: 0 },
      { label: '8-14 days', min: 8, max: 14, count: 0 },
      { label: '15-30 days', min: 15, max: 30, count: 0 },
      { label: '31-60 days', min: 31, max: 60, count: 0 },
      { label: '60+ days', min: 61, max: Infinity, count: 0 },
    ]
    for (const d of durations) {
      const bucket = buckets.find((b) => d >= b.min && d <= b.max)
      if (bucket) bucket.count += 1
    }

    return {
      average: avg,
      median,
      min,
      max,
      count: hiredApps.length,
      distribution: buckets.filter((b) => b.count > 0),
    }
  }, [filteredApps])

  // ─── Summary Stats ─────────────────────────────────
  const totalApps = filteredApps.length
  const activeApps = filteredApps.filter((a) => !['hired', 'rejected'].includes(a.status)).length
  const hiredCount = stageDistribution.hired
  const rejectedCount = stageDistribution.rejected
  const hireRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading metrics...</Text>
      </Stack>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} paddingVertical={16}>
        {/*
          The screen's own `ScreenHeader` sits above this view already, so the
          "Hiring Metrics" H2 with an icon beside it was a second title on the
          same page (#838). The date range is the only control that belonged
          to it, so that is all that is left.
        */}
        <Row justify="space-between" align="center" gap={12} wrap>
          <H3>Your numbers</H3>
          <ResponsiveSelect
            value={String(dateRange)}
            onValueChange={(v) => setDateRange(Number(v))}
            placeholder="Date range"
            size="sm"
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '14', label: 'Last 14 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
          />
        </Row>

        {/*
          Four figures the organisation reads about itself, on one hairline
          band — the same pattern as the "Candidates can see in" band above,
          which is the point: these are the private counterpart of those. They
          were four tinted tiles with a coloured icon each, and the icons were
          hardcoded hex (#6366f1, #3b82f6, #10b981, #f59e0b) that belonged to
          no theme and no token file.
        */}
        <MetricRow bordered minColumnWidth={150}>
          <MetricBlock
            label="Applications"
            value={totalApps}
            delta={`in the last ${dateRange} days`}
          />
          <MetricBlock label="Active in pipeline" value={activeApps} />
          <MetricBlock label="Hired" value={hiredCount} delta={`${hireRate}% of applications`} />
          <MetricBlock
            label="Average time to hire"
            value={timeToHireStats.count > 0 ? `${timeToHireStats.average}d` : '—'}
            delta={
              timeToHireStats.count > 0
                ? `over ${timeToHireStats.count} hire${timeToHireStats.count === 1 ? '' : 's'}`
                : 'no hires yet'
            }
          />
        </MetricRow>

        <Separator />

        {/* Pipeline Funnel */}
        <Stack gap={12}>
          <H3>Pipeline funnel</H3>
          <Stack gap={8}>
            {PIPELINE_STAGES.filter((s) => s.key !== 'rejected').map((stage) => {
              const count = stageDistribution[stage.key] || 0
              const maxCount = Math.max(...Object.values(stageDistribution), 1)
              const barWidth = Math.max((count / maxCount) * 100, 4)
              return (
                <Row key={stage.key} gap={8} align="center">
                  <Text
                    style={{
                      width: 80,
                      color: colors.text[theme].secondary,
                      fontSize: 12,
                    }}
                  >
                    {stage.label}
                  </Text>
                  <Stack style={{ flex: 1, height: 24, justifyContent: 'center' }}>
                    <Stack
                      style={{
                        height: 20,
                        width: `${barWidth}%`,
                        backgroundColor: stage.color,
                        borderRadius: 4,
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                        minWidth: 30,
                      }}
                    >
                      <Text style={{ color: colors.text[theme].quaternary, fontSize: 11 }}>
                        {count}
                      </Text>
                    </Stack>
                  </Stack>
                </Row>
              )
            })}
            {/* Rejected shown separately */}
            <Stack
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border[theme].default,
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <Row gap={8} align="center">
                <Text style={{ width: 80, color: colors.text[theme].tertiary, fontSize: 12 }}>
                  Rejected
                </Text>
                <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                  {rejectedCount}
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>

        {/* Conversion Rates */}
        {conversionRates.length > 0 && (
          <>
            <Separator />
            <Stack gap={12}>
              <H3>Stage conversion rates</H3>
              <Stack gap={6}>
                {conversionRates.map((item, idx) => (
                  <Row key={item.stage} gap={8} align="center">
                    <Text style={{ width: 80, color: colors.text[theme].secondary, fontSize: 12 }}>
                      {item.stage}
                    </Text>
                    <Stack style={{ flex: 1 }}>
                      <Stack
                        style={{
                          height: 6,
                          backgroundColor: colors.bg[theme].muted,
                          borderRadius: 3,
                        }}
                      >
                        <Stack
                          style={{
                            height: 6,
                            width: `${item.rate}%`,
                            backgroundColor:
                              PIPELINE_STAGES[idx]?.color ?? colors.text[theme].tertiary,
                            borderRadius: 3,
                          }}
                        />
                      </Stack>
                    </Stack>
                    <Text
                      style={{
                        width: 50,
                        textAlign: 'right',
                        color: colors.text[theme].secondary,
                        fontSize: 12,
                      }}
                    >
                      {item.rate}%
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Stack>
          </>
        )}

        <Separator />

        {/* Source of Hire (Issue #91) */}
        <Stack gap={12}>
          <H3>Source of hire</H3>
          {sourceDistribution.length === 0 ? (
            <Text style={{ color: colors.text[theme].tertiary }}>
              No source data available yet.
            </Text>
          ) : (
            <Stack gap={8}>
              {sourceDistribution.map((item) => (
                <Row key={item.source} gap={8} align="center">
                  <Stack
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text style={{ flex: 1, color: colors.text[theme].secondary, fontSize: 13 }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                    {item.count}
                  </Text>
                  <Text
                    style={{
                      width: 40,
                      textAlign: 'right',
                      color: colors.text[theme].tertiary,
                      fontSize: 12,
                    }}
                  >
                    {item.percentage}%
                  </Text>
                </Row>
              ))}
            </Stack>
          )}
        </Stack>

        <Separator />

        {/* Time-to-Hire (Issue #92) */}
        <Stack gap={12}>
          <H3>Time to hire</H3>
          {timeToHireStats.count === 0 ? (
            <Text style={{ color: colors.text[theme].tertiary }}>
              No completed hires to analyze yet.
            </Text>
          ) : (
            <Stack gap={12}>
              <MetricRow bordered minColumnWidth={120}>
                <MetricBlock label="Average" value={`${timeToHireStats.average}d`} />
                <MetricBlock label="Median" value={`${timeToHireStats.median}d`} />
                <MetricBlock label="Fastest" value={`${timeToHireStats.min}d`} />
                <MetricBlock label="Slowest" value={`${timeToHireStats.max}d`} />
              </MetricRow>

              {/* Distribution bars */}
              <Stack gap={6}>
                <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>
                  Distribution
                </Text>
                {timeToHireStats.distribution.map((bucket) => {
                  const maxBucket = Math.max(...timeToHireStats.distribution.map((b) => b.count), 1)
                  const barWidth = Math.max((bucket.count / maxBucket) * 100, 4)
                  return (
                    <Row key={bucket.label} gap={8} align="center">
                      <Text style={{ width: 80, color: colors.text[theme].tertiary, fontSize: 11 }}>
                        {bucket.label}
                      </Text>
                      <Stack style={{ flex: 1, height: 18, justifyContent: 'center' }}>
                        <Stack
                          style={{
                            height: 14,
                            width: `${barWidth}%`,
                            backgroundColor: colors.warning[theme === 'light' ? 600 : 300],
                            borderRadius: 3,
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                            minWidth: 24,
                          }}
                        >
                          <Text style={{ color: colors.text[theme].quaternary, fontSize: 10 }}>
                            {bucket.count}
                          </Text>
                        </Stack>
                      </Stack>
                    </Row>
                  )
                })}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </ScrollView>
  )
}
