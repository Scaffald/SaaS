/**
 * EEO/OFCCP Compliance Report Screen
 *
 * Dashboard for generating and viewing Equal Employment Opportunity reports.
 * Supports EEO-1, adverse impact analysis, and OFCCP applicant flow tracking.
 *
 * @see Issue #95
 */

import { useState, useMemo } from 'react'
import { ScrollView, Pressable } from 'react-native'
import { useEEOReport } from '@scf/core/utils/compliance-sdk-hooks'
import { Button, Card, H2, Row, Stack, Tabs, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  BarChart3,
  Download,
  FileText,
  Info,
  PieChart,
  ShieldCheck,
  Users,
} from 'lucide-react-native'

// ============================================================================
// Types
// ============================================================================

/**
 * Period presets, resolved to the date range the API filters on.
 *
 * Quarters are calendar quarters of the current year; YTD runs from 1 January
 * to today. Computed at render rather than module load so the report does not
 * silently keep reporting last year after a new year starts.
 */
function periodRange(period: ReportPeriod): { start: string; end: string } {
  const now = new Date()
  const year = now.getUTCFullYear()
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  if (period === 'ytd') {
    return { start: `${year}-01-01`, end: iso(now) }
  }
  const quarter = Number(period.slice(1))
  const startMonth = (quarter - 1) * 3
  return {
    start: iso(new Date(Date.UTC(year, startMonth, 1))),
    end: iso(new Date(Date.UTC(year, startMonth + 3, 0))),
  }
}

/**
 * Chart colours per category.
 *
 * Includes `declined`, which the two inline maps this replaces did not: it is
 * a real value in the database's CHECK constraint and appears in every
 * dimension, so it was previously rendering with an undefined background.
 * `categoryColor` falls back rather than returning undefined, because a value
 * outside the vocabulary means the constraint was bypassed and the bar should
 * still be visible.
 */
const CATEGORY_COLORS: Record<string, string> = {
  hispanic: '#3b82f6',
  white: '#6366f1',
  black: '#8b5cf6',
  asian: '#ec4899',
  native_american: '#f59e0b',
  pacific_islander: '#10b981',
  two_or_more: '#64748b',
  declined: '#94a3b8',
}

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#94a3b8'
}

/** Display labels for the database's category vocabulary. */
const CATEGORY_LABELS: Record<string, string> = {
  hispanic: 'Hispanic or Latino',
  white: 'White',
  black: 'Black or African American',
  asian: 'Asian',
  native_american: 'American Indian or Alaska Native',
  pacific_islander: 'Native Hawaiian or Pacific Islander',
  two_or_more: 'Two or More Races',
  male: 'Male',
  female: 'Female',
  non_binary: 'Non-Binary',
  protected_veteran: 'Protected Veteran',
  non_veteran: 'Non-Veteran',
  yes: 'With Disability',
  no: 'Without Disability',
  declined: 'Declined to State',
  uncategorized: 'Uncategorized',
}

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

/** Percentage, or an em dash when the value is genuinely absent. */
function formatRate(rate: number | null): string {
  return rate === null ? '—' : `${(rate * 100).toFixed(1)}%`
}

type ReportPeriod = 'q1' | 'q2' | 'q3' | 'q4' | 'ytd'
// ============================================================================

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string
  value: string | number
  sublabel?: string
  icon: typeof Users
}) {
  const { theme } = useThemeContext()
  return (
    <Card
      variant="glass"
      padding="md"
      style={{ flex: 1, minWidth: 140, backgroundColor: colors.bg[theme].subtle }}
    >
      <Stack gap={4}>
        <Row gap={8} align="center">
          <Icon size={16} color={colors.icon[theme].default} />
          <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>{label}</Text>
        </Row>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text[theme].primary }}>
          {value}
        </Text>
        {sublabel && (
          <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>{sublabel}</Text>
        )}
      </Stack>
    </Card>
  )
}

/**
 * `ratio === null` means the four-fifths ratio could not be computed — no
 * applicants, nobody hired anywhere, or a cell suppressed for being too small.
 *
 * It is rendered as "—", never as 0%. The previous version took a plain
 * `number` and divided unconditionally upstream, so an organisation that had
 * hired nobody produced `0/0` and this badge rendered `NaN% ✓ Pass` — a false
 * all-clear on a document people file.
 */
function AdverseImpactBadge({ ratio }: { ratio: number | null }) {
  const { theme } = useThemeContext()

  if (ratio === null) {
    return <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>—</Text>
  }

  const isFlagged = ratio < 0.8
  return (
    <Stack
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: isFlagged
          ? theme === 'dark'
            ? colors.error[900]
            : colors.error[50]
          : theme === 'dark'
            ? colors.success[900]
            : colors.success[50],
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: isFlagged ? colors.fg[theme].error : colors.fg[theme].success,
        }}
      >
        {(ratio * 100).toFixed(0)}% {isFlagged ? '⚠ Flag' : '✓ Pass'}
      </Text>
    </Stack>
  )
}

/**
 * Adverse-impact flags across every dimension.
 *
 * Exported so the count can be asserted directly: reading it out of the metric
 * tile means matching a bare number in the DOM, which passes by accident.
 *
 * Two things this gets right that the previous version did not. It looks at
 * ethnicity — the tile used to count only the three gender ratios, so a flag
 * in the dimension an EEO-1 exists for never reached the summary. And a null
 * ratio is not a flag: null means the comparison could not be made, not that
 * it was made and failed.
 */
export function countAdverseImpactFlags(
  report:
    | {
        jobGroups: Array<{ categories: Array<{ impactRatio: number | null }> }>
        gender: Array<{ impactRatio: number | null }>
        veteranStatus: Array<{ impactRatio: number | null }>
        disabilityStatus: Array<{ impactRatio: number | null }>
      }
    | undefined
): number {
  if (!report) return 0
  return [
    ...report.jobGroups.flatMap((group) => group.categories),
    ...report.gender,
    ...report.veteranStatus,
    ...report.disabilityStatus,
  ].filter((category) => category.impactRatio !== null && category.impactRatio < 0.8).length
}

// ============================================================================
// Main Component
// ============================================================================

export function EEOReportScreen() {
  const { theme } = useThemeContext()
  const [period, setPeriod] = useState<ReportPeriod>('ytd')

  const range = useMemo(() => periodRange(period), [period])
  const reportQuery = useEEOReport({
    period_start: range.start,
    period_end: range.end,
  })
  const report = reportQuery.data

  const periods: Array<{ value: ReportPeriod; label: string }> = [
    { value: 'q1', label: 'Q1' },
    { value: 'q2', label: 'Q2' },
    { value: 'q3', label: 'Q3' },
    { value: 'q4', label: 'Q4' },
    { value: 'ytd', label: 'YTD' },
  ]

  const jobGroups = report?.jobGroups ?? []
  const genderRows = report?.gender ?? []
  const veteranRows = report?.veteranStatus ?? []
  const totals = report?.totals ?? {
    applications: 0,
    hired: 0,
    withdrawn: 0,
    jobGroups: 0,
    selfIdentified: 0,
  }

  /**
   * Overall hire rate. Guarded: with no applicants this was
   * `(0 / 0) * 100` and rendered "NaN% rate".
   */
  const hireRate = totals.applications > 0 ? totals.hired / totals.applications : null

  /**
   * Flags across every dimension, not just gender.
   *
   * The tile previously counted only the three gender ratios, so adverse
   * impact against an ethnicity — the dimension the EEO-1 exists for — never
   * reached the summary. A null ratio is not a flag: it means the comparison
   * could not be made.
   */
  const adverseImpactFlagCount = useMemo(() => countAdverseImpactFlags(report), [report])

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {reportQuery.isError && (
          <Card variant="glass" padding="md">
            <Text style={{ color: colors.fg[theme].error }}>
              Could not load the report. {(reportQuery.error as Error)?.message ?? ''}
            </Text>
          </Card>
        )}

        {/* Coverage. Self-identification is voluntary, so the ratios below are
            computed over whoever chose to answer — which is frequently a small
            fraction of applicants. Stating the denominator is the difference
            between a statistic and a number. */}
        {report && (
          <Card variant="glass" padding="md">
            <Row gap={12} align="center">
              <ShieldCheck
                size={20}
                color={
                  report.coverage.selfIdentified === 0
                    ? colors.fg[theme].warning
                    : colors.fg[theme].success
                }
              />
              <Stack flex={1} gap={2}>
                <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
                  {report.coverage.selfIdentified} of {report.coverage.totalApplications} applicants
                  self-identified
                </Text>
                <Text style={{ fontSize: 13, color: colors.text[theme].tertiary }}>
                  {report.coverage.selfIdentified === 0
                    ? 'No EEO self-identification has been collected, so this report has nothing to summarise. The figures below are real and read zero.'
                    : `Self-identification is voluntary. Groups smaller than ${report.minCellSize} applicants are suppressed so individuals cannot be identified.`}
                  {report.coverage.uncategorizedJobs > 0 &&
                    ` ${report.coverage.uncategorizedJobs} job${
                      report.coverage.uncategorizedJobs === 1 ? '' : 's'
                    } have no EEO job category and roll up as Uncategorized.`}
                </Text>
              </Stack>
            </Row>
          </Card>
        )}

        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <H2>EEO/OFCCP Compliance Reports</H2>
            <Text style={{ color: colors.text[theme].secondary }}>
              Equal Employment Opportunity and OFCCP applicant flow reporting
            </Text>
          </Stack>
          {/* The figures are real now, but there is still no export
              implementation — this button never had an onPress. Leaving it
              enabled would produce a control that silently does nothing on a
              screen whose whole purpose is producing a filing. */}
          <Button variant="outline" size="sm" iconStart={Download} disabled>
            Export coming soon
          </Button>
        </Row>

        {/* Compliance Status Banner */}
        {/* Period Selector */}
        <Row gap={8}>
          {periods.map((p) => (
            <Pressable key={p.value} onPress={() => setPeriod(p.value)}>
              <Stack
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor:
                    period === p.value ? colors.fg[theme].active : colors.bg[theme].subtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: period === p.value ? '#fff' : colors.text[theme].secondary,
                  }}
                >
                  {p.label}
                </Text>
              </Stack>
            </Pressable>
          ))}
        </Row>

        {/* Summary Metrics */}
        <Row gap={12} style={{ flexWrap: 'wrap' }}>
          <MetricCard
            label="Total Applications"
            value={totals.applications}
            sublabel={`${period.toUpperCase()} period`}
            icon={FileText}
          />
          <MetricCard
            label="Total Hired"
            value={totals.hired}
            sublabel={hireRate === null ? 'no applicants' : `${(hireRate * 100).toFixed(1)}% rate`}
            icon={Users}
          />
          <MetricCard
            label="Job Groups"
            value={totals.jobGroups}
            sublabel="Active categories"
            icon={BarChart3}
          />
          <MetricCard
            label="Adverse Impact"
            value={adverseImpactFlagCount}
            sublabel="Flags detected"
            icon={ShieldCheck}
          />
        </Row>

        {/* Tabs */}
        <Tabs defaultValue="eeo1">
          <Tabs.Item value="eeo1">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>EEO-1 Summary</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} paddingTop={16}>
                {jobGroups.length === 0 && (
                  <Card variant="glass" padding="md">
                    <Text style={{ color: colors.text[theme].tertiary }}>
                      {reportQuery.isLoading
                        ? 'Loading…'
                        : 'No applicant has self-identified in this period, so there is nothing to tabulate.'}
                    </Text>
                  </Card>
                )}
                {jobGroups.map((group) => (
                  <Card key={group.jobGroup} variant="glass" padding="md">
                    <Stack gap={12}>
                      <Row justify="space-between" align="center">
                        <Stack>
                          <Text
                            style={{
                              fontWeight: '600',
                              fontSize: 15,
                              color: colors.text[theme].primary,
                            }}
                          >
                            {categoryLabel(group.jobGroup)}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                            {group.totalApplications} applicants • {group.totalHired} hired
                          </Text>
                        </Stack>
                      </Row>

                      {/* Category breakdown */}
                      <Stack gap={6}>
                        <Row gap={0} style={{ paddingHorizontal: 4 }}>
                          <Text
                            style={{
                              flex: 2,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                            }}
                          >
                            Category
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                              textAlign: 'center',
                            }}
                          >
                            Applied
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                              textAlign: 'center',
                            }}
                          >
                            Interviewed
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                              textAlign: 'center',
                            }}
                          >
                            Hired
                          </Text>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                              textAlign: 'center',
                            }}
                          >
                            Rate
                          </Text>
                          {/* The four-fifths ratio was computed for ethnicity
                              and then never shown — the summary tile counted
                              the flag but the table it came from had no column
                              for it, so nobody could see which group was
                              flagged. This is the dimension an EEO-1 exists
                              for. */}
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              fontWeight: '600',
                              color: colors.text[theme].tertiary,
                              textAlign: 'center',
                            }}
                          >
                            4/5ths
                          </Text>
                        </Row>

                        {group.categories.map((cat) => (
                          <Row
                            key={cat.category}
                            gap={0}
                            style={{
                              paddingVertical: 6,
                              paddingHorizontal: 4,
                              borderRadius: 4,
                              backgroundColor: colors.bg[theme].subtle,
                            }}
                          >
                            <Text
                              style={{ flex: 2, fontSize: 13, color: colors.text[theme].primary }}
                            >
                              {categoryLabel(cat.category)}
                              {cat.suppressed && (
                                <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                                  {'  '}(suppressed)
                                </Text>
                              )}
                            </Text>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 13,
                                color: colors.text[theme].secondary,
                                textAlign: 'center',
                              }}
                            >
                              {cat.applications}
                            </Text>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 13,
                                color: colors.text[theme].secondary,
                                textAlign: 'center',
                              }}
                            >
                              {cat.interviewed}
                            </Text>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 13,
                                color: colors.text[theme].secondary,
                                textAlign: 'center',
                              }}
                            >
                              {cat.hired}
                            </Text>
                            <Text
                              style={{
                                flex: 1,
                                fontSize: 13,
                                color: colors.text[theme].secondary,
                                textAlign: 'center',
                              }}
                            >
                              {formatRate(cat.selectionRate)}
                            </Text>
                            <Stack style={{ flex: 1, alignItems: 'center' }}>
                              <AdverseImpactBadge ratio={cat.impactRatio} />
                            </Stack>
                          </Row>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          {/* Adverse Impact Tab */}
          <Tabs.Item value="adverse">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Adverse Impact</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} paddingTop={16}>
                <Card
                  variant="glass"
                  padding="md"
                  style={{ backgroundColor: colors.bg[theme].subtle }}
                >
                  <Row gap={12} align="center">
                    <Info size={16} color={colors.icon[theme].default} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.text[theme].secondary }}>
                      The 4/5ths (80%) rule: A selection rate for any group that is less than 80% of
                      the highest group's rate may indicate adverse impact.
                    </Text>
                  </Row>
                </Card>

                {/* Gender Analysis */}
                <Card variant="glass" padding="md">
                  <Stack gap={12}>
                    <Text
                      style={{ fontWeight: '600', fontSize: 15, color: colors.text[theme].primary }}
                    >
                      Gender Analysis
                    </Text>
                    <Row gap={0} style={{ paddingHorizontal: 4 }}>
                      <Text
                        style={{
                          flex: 2,
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.text[theme].tertiary,
                        }}
                      >
                        Group
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.text[theme].tertiary,
                          textAlign: 'center',
                        }}
                      >
                        Applied
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.text[theme].tertiary,
                          textAlign: 'center',
                        }}
                      >
                        Hired
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.text[theme].tertiary,
                          textAlign: 'center',
                        }}
                      >
                        Rate
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 11,
                          fontWeight: '600',
                          color: colors.text[theme].tertiary,
                          textAlign: 'center',
                        }}
                      >
                        4/5ths
                      </Text>
                    </Row>
                    {/* Every declared gender, including "Declined to State".
                        The mock listed three and dropped declined entirely,
                        which hid people who are in the denominator. */}
                    {genderRows.map((row) => (
                      <Row
                        key={row.category}
                        gap={0}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                          backgroundColor: colors.bg[theme].subtle,
                        }}
                      >
                        <Text style={{ flex: 2, fontSize: 13, color: colors.text[theme].primary }}>
                          {categoryLabel(row.category)}
                          {row.suppressed && (
                            <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                              {'  '}(suppressed)
                            </Text>
                          )}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.applications}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.hired}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {formatRate(row.selectionRate)}
                        </Text>
                        <Stack style={{ flex: 1, alignItems: 'center' }}>
                          <AdverseImpactBadge ratio={row.impactRatio} />
                        </Stack>
                      </Row>
                    ))}
                  </Stack>
                </Card>

                {/* Veteran Analysis */}
                <Card variant="glass" padding="md">
                  <Stack gap={12}>
                    <Text
                      style={{ fontWeight: '600', fontSize: 15, color: colors.text[theme].primary }}
                    >
                      Veteran Status Analysis
                    </Text>
                    {veteranRows.map((row) => (
                      <Row
                        key={row.category}
                        gap={0}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                          backgroundColor: colors.bg[theme].subtle,
                        }}
                      >
                        <Text style={{ flex: 2, fontSize: 13, color: colors.text[theme].primary }}>
                          {categoryLabel(row.category)}
                          {row.suppressed && (
                            <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                              {'  '}(suppressed)
                            </Text>
                          )}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.applications}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.hired}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {formatRate(row.selectionRate)}
                        </Text>
                      </Row>
                    ))}
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          {/* Applicant Flow Tab */}
          <Tabs.Item value="applicant-flow">
            <Tabs.Trigger containerStyle={{ flex: 1 }}>Applicant Flow</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} paddingTop={16}>
                <Card
                  variant="glass"
                  padding="md"
                  style={{ backgroundColor: colors.bg[theme].subtle }}
                >
                  <Row gap={12} align="center">
                    <PieChart size={16} color={colors.icon[theme].default} />
                    <Text style={{ flex: 1, fontSize: 13, color: colors.text[theme].secondary }}>
                      OFCCP Applicant Flow Log — Tracks the demographic composition of applicants at
                      each stage of the hiring pipeline for federal contractor compliance.
                    </Text>
                  </Row>
                </Card>

                {jobGroups.map((group) => {
                  const stages = ['Applied', 'Interviewed', 'Offered', 'Hired'] as const
                  const stageKeys = ['applications', 'interviewed', 'offers', 'hired'] as const

                  return (
                    <Card key={group.jobGroup} variant="glass" padding="md">
                      <Stack gap={12}>
                        <Text
                          style={{
                            fontWeight: '600',
                            fontSize: 15,
                            color: colors.text[theme].primary,
                          }}
                        >
                          {categoryLabel(group.jobGroup)} — Applicant Flow
                        </Text>

                        {/* Pipeline bars */}
                        {stages.map((stage, stageIdx) => {
                          const key = stageKeys[stageIdx]
                          const total = group.categories.reduce((sum, c) => sum + c[key], 0)
                          if (total === 0) return null

                          return (
                            <Stack key={stage} gap={4}>
                              <Row justify="space-between">
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: '500',
                                    color: colors.text[theme].primary,
                                  }}
                                >
                                  {stage}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                                  {total} total
                                </Text>
                              </Row>
                              <Row
                                gap={1}
                                style={{ height: 24, borderRadius: 6, overflow: 'hidden' }}
                              >
                                {group.categories.map((cat) => {
                                  const value = cat[key]
                                  if (value === 0) return null
                                  const pct = (value / total) * 100

                                  return (
                                    <Stack
                                      key={cat.category}
                                      style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        backgroundColor: categoryColor(cat.category),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}
                                    >
                                      {pct > 10 && (
                                        <Text
                                          style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}
                                        >
                                          {value}
                                        </Text>
                                      )}
                                    </Stack>
                                  )
                                })}
                              </Row>
                            </Stack>
                          )
                        })}

                        {/* Legend */}
                        <Row gap={12} style={{ flexWrap: 'wrap', marginTop: 4 }}>
                          {group.categories.map((cat) => {
                            return (
                              <Row key={cat.category} gap={4} align="center">
                                <Stack
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: categoryColor(cat.category),
                                  }}
                                />
                                <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                                  {categoryLabel(cat.category)}
                                </Text>
                              </Row>
                            )
                          })}
                        </Row>
                      </Stack>
                    </Card>
                  )
                })}
              </Stack>
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>
      </Stack>
    </ScrollView>
  )
}
