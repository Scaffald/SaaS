/**
 * ATS Metrics Dashboard — Basic hiring funnel analytics.
 * Shows pipeline funnel, stage distribution, conversion rates,
 * source-of-hire tracking, and time-to-hire reporting.
 *
 * @see Issue #90 (Basic Metrics Dashboard)
 * @see Issue #91 (Source-of-Hire Tracking)
 * @see Issue #92 (Time-to-Hire Reporting)
 */

import { BarChart3, Clock, Filter, TrendingUp, Users } from 'lucide-react-native'
import { type ReactNode, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import {
  Card,
  H2,
  ResponsiveSelect,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus, MockApplication } from '../../mock-data/ats-mock-data'

/** Pipeline stage display config */
const PIPELINE_STAGES: Array<{
  key: ApplicationStatus
  label: string
  color: string
}> = [
  { key: 'new', label: 'New', color: '#6366f1' },
  { key: 'screen', label: 'Screening', color: '#8b5cf6' },
  { key: 'inquired', label: 'Inquiry', color: '#a78bfa' },
  { key: 'interview', label: 'Interview', color: '#3b82f6' },
  { key: 'offer', label: 'Offer', color: '#f59e0b' },
  { key: 'hired', label: 'Hired', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
]

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

const SOURCE_COLORS: Record<HireSource, string> = {
  scaffald: '#6366f1',
  referral: '#10b981',
  external_board: '#f59e0b',
  social_media: '#3b82f6',
  company_website: '#8b5cf6',
  other: '#94a3b8',
}

interface ATSMetricsDashboardProps {
  applications: MockApplication[]
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
  stageHistory: MockApplication['stageHistory'] | undefined
): string | null {
  const hires = (stageHistory ?? []).filter((change) => change.toStage === 'hired')
  if (hires.length === 0) return null

  // Last one wins: a re-hire after a reversal is the hire that counts.
  return hires.reduce((latest, change) =>
    Date.parse(change.changedAt) > Date.parse(latest.changedAt) ? change : latest
  ).changedAt
}

/** Days from application to hire, or null when the hire is not recorded. */
export function timeToHireDays(app: MockApplication): number | null {
  const hiredAt = hiredAtFrom(app.stageHistory)
  return hiredAt ? daysBetween(app.appliedAt, hiredAt) : null
}

export function ATSMetricsDashboard({ applications, isLoading = false }: ATSMetricsDashboardProps) {
  const { theme } = useThemeContext()
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
  }, [filteredApps])

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
  }, [filteredApps])

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
      <Stack gap={20} padding="md">
        {/* Header */}
        <Row justify="space-between" align="center" wrap>
          <Row gap={8} align="center">
            <BarChart3 size={20} color={colors.icon[theme].default} />
            <H2>Hiring Metrics</H2>
          </Row>
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

        {/* Summary Tiles */}
        <Row gap={12} wrap>
          <MetricTile
            icon={<Users size={16} color="#6366f1" />}
            label="Total Applications"
            value={totalApps}
            theme={theme}
          />
          <MetricTile
            icon={<Filter size={16} color="#3b82f6" />}
            label="Active in Pipeline"
            value={activeApps}
            theme={theme}
          />
          <MetricTile
            icon={<TrendingUp size={16} color="#10b981" />}
            label="Hired"
            value={hiredCount}
            subtitle={`${hireRate}% hire rate`}
            theme={theme}
          />
          <MetricTile
            icon={<Clock size={16} color="#f59e0b" />}
            label="Avg. Time to Hire"
            value={`${timeToHireStats.average}d`}
            subtitle={timeToHireStats.count > 0 ? `${timeToHireStats.count} hires` : 'No hires yet'}
            theme={theme}
          />
        </Row>

        {/* Pipeline Funnel */}
        <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Text style={{ marginBottom: 12, color: colors.text[theme].primary }}>
            Pipeline Funnel
          </Text>
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
                      <Text style={{ color: '#fff', fontSize: 11 }}>{count}</Text>
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
        </Card>

        {/* Conversion Rates */}
        {conversionRates.length > 0 && (
          <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
            <Text style={{ marginBottom: 12, color: colors.text[theme].primary }}>
              Stage Conversion Rates
            </Text>
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
                          backgroundColor: PIPELINE_STAGES[idx]?.color || '#6366f1',
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
          </Card>
        )}

        {/* Source of Hire (Issue #91) */}
        <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Text style={{ marginBottom: 12, color: colors.text[theme].primary }}>
            Source of Hire
          </Text>
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
        </Card>

        {/* Time-to-Hire (Issue #92) */}
        <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Text style={{ marginBottom: 12, color: colors.text[theme].primary }}>Time to Hire</Text>
          {timeToHireStats.count === 0 ? (
            <Text style={{ color: colors.text[theme].tertiary }}>
              No completed hires to analyze yet.
            </Text>
          ) : (
            <Stack gap={12}>
              <Row gap={12} wrap>
                <MiniStat label="Average" value={`${timeToHireStats.average} days`} theme={theme} />
                <MiniStat label="Median" value={`${timeToHireStats.median} days`} theme={theme} />
                <MiniStat label="Fastest" value={`${timeToHireStats.min} days`} theme={theme} />
                <MiniStat label="Slowest" value={`${timeToHireStats.max} days`} theme={theme} />
              </Row>

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
                            backgroundColor: '#f59e0b',
                            borderRadius: 3,
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                            minWidth: 24,
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 10 }}>{bucket.count}</Text>
                        </Stack>
                      </Stack>
                    </Row>
                  )
                })}
              </Stack>
            </Stack>
          )}
        </Card>
      </Stack>
    </ScrollView>
  )
}

/** Metric tile component */
function MetricTile({
  icon,
  label,
  value,
  subtitle,
  theme,
}: {
  icon: ReactNode
  label: string
  value: string | number
  subtitle?: string
  theme: 'light' | 'dark'
}) {
  return (
    <Card
      padding="md"
      style={{
        backgroundColor: colors.bg[theme].subtle,
        minWidth: 140,
        flex: 1,
      }}
    >
      <Stack gap={4}>
        <Row gap={6} align="center">
          {icon}
          <Text
            style={{ color: colors.text[theme].tertiary, fontSize: 11, textTransform: 'uppercase' }}
          >
            {label}
          </Text>
        </Row>
        <Text style={{ color: colors.text[theme].primary, fontSize: 22 }}>{value}</Text>
        {subtitle && (
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>{subtitle}</Text>
        )}
      </Stack>
    </Card>
  )
}

/** Small stat display */
function MiniStat({
  label,
  value,
  theme,
}: {
  label: string
  value: string
  theme: 'light' | 'dark'
}) {
  return (
    <Stack
      gap={2}
      style={{
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 80,
      }}
    >
      <Text
        style={{ color: colors.text[theme].tertiary, fontSize: 10, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>{value}</Text>
    </Stack>
  )
}
