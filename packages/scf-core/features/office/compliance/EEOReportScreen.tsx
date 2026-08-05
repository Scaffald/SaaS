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
import { SampleDataNotice } from '@scf/core/features/office/components/SampleDataNotice'

// ============================================================================
// Types
// ============================================================================

type ReportPeriod = 'q1' | 'q2' | 'q3' | 'q4' | 'ytd'
type EEOCategory =
  | 'hispanic'
  | 'white'
  | 'black'
  | 'asian'
  | 'native_american'
  | 'pacific_islander'
  | 'two_or_more'

interface EEOCategoryData {
  category: EEOCategory
  label: string
  applications: number
  interviewed: number
  offers: number
  hired: number
  selectionRate: number
}

interface JobGroupData {
  jobGroup: string
  jobCode: string
  totalApplications: number
  totalHired: number
  categories: EEOCategoryData[]
}

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Every figure on this screen is fabricated. The real EEO fields landed in
 * migration 305_privacy_eeo_project_hiring.sql but nothing reads them yet.
 *
 * Until that wiring exists (#535), the screen must not present itself as a
 * compliance record: an EEO report is an artifact people file, and invented
 * adverse-impact ratios are worse than no ratios at all.
 *
 * Deleting this constant is the last step of #535 — the type error it raises
 * points at every place that still needs real data.
 */
const USES_SAMPLE_DATA: boolean = true

const MOCK_JOB_GROUPS: JobGroupData[] = [
  {
    jobGroup: 'Construction Laborers',
    jobCode: '47-2061',
    totalApplications: 245,
    totalHired: 38,
    categories: [
      {
        category: 'hispanic',
        label: 'Hispanic/Latino',
        applications: 89,
        interviewed: 52,
        offers: 18,
        hired: 15,
        selectionRate: 16.9,
      },
      {
        category: 'white',
        label: 'White',
        applications: 78,
        interviewed: 48,
        offers: 12,
        hired: 10,
        selectionRate: 12.8,
      },
      {
        category: 'black',
        label: 'Black/African American',
        applications: 42,
        interviewed: 22,
        offers: 7,
        hired: 6,
        selectionRate: 14.3,
      },
      {
        category: 'asian',
        label: 'Asian',
        applications: 18,
        interviewed: 10,
        offers: 3,
        hired: 3,
        selectionRate: 16.7,
      },
      {
        category: 'native_american',
        label: 'Native American',
        applications: 8,
        interviewed: 4,
        offers: 2,
        hired: 2,
        selectionRate: 25.0,
      },
      {
        category: 'pacific_islander',
        label: 'Pacific Islander',
        applications: 5,
        interviewed: 3,
        offers: 1,
        hired: 1,
        selectionRate: 20.0,
      },
      {
        category: 'two_or_more',
        label: 'Two or More',
        applications: 5,
        interviewed: 3,
        offers: 1,
        hired: 1,
        selectionRate: 20.0,
      },
    ],
  },
  {
    jobGroup: 'Electricians',
    jobCode: '47-2111',
    totalApplications: 156,
    totalHired: 22,
    categories: [
      {
        category: 'hispanic',
        label: 'Hispanic/Latino',
        applications: 48,
        interviewed: 28,
        offers: 8,
        hired: 7,
        selectionRate: 14.6,
      },
      {
        category: 'white',
        label: 'White',
        applications: 62,
        interviewed: 38,
        offers: 9,
        hired: 8,
        selectionRate: 12.9,
      },
      {
        category: 'black',
        label: 'Black/African American',
        applications: 28,
        interviewed: 14,
        offers: 4,
        hired: 4,
        selectionRate: 14.3,
      },
      {
        category: 'asian',
        label: 'Asian',
        applications: 10,
        interviewed: 6,
        offers: 1,
        hired: 1,
        selectionRate: 10.0,
      },
      {
        category: 'native_american',
        label: 'Native American',
        applications: 4,
        interviewed: 2,
        offers: 1,
        hired: 1,
        selectionRate: 25.0,
      },
      {
        category: 'pacific_islander',
        label: 'Pacific Islander',
        applications: 2,
        interviewed: 1,
        offers: 0,
        hired: 0,
        selectionRate: 0,
      },
      {
        category: 'two_or_more',
        label: 'Two or More',
        applications: 2,
        interviewed: 1,
        offers: 1,
        hired: 1,
        selectionRate: 50.0,
      },
    ],
  },
  {
    jobGroup: 'Construction Managers',
    jobCode: '11-9021',
    totalApplications: 89,
    totalHired: 8,
    categories: [
      {
        category: 'hispanic',
        label: 'Hispanic/Latino',
        applications: 22,
        interviewed: 14,
        offers: 3,
        hired: 2,
        selectionRate: 9.1,
      },
      {
        category: 'white',
        label: 'White',
        applications: 38,
        interviewed: 26,
        offers: 4,
        hired: 4,
        selectionRate: 10.5,
      },
      {
        category: 'black',
        label: 'Black/African American',
        applications: 16,
        interviewed: 8,
        offers: 1,
        hired: 1,
        selectionRate: 6.3,
      },
      {
        category: 'asian',
        label: 'Asian',
        applications: 8,
        interviewed: 5,
        offers: 1,
        hired: 1,
        selectionRate: 12.5,
      },
      {
        category: 'native_american',
        label: 'Native American',
        applications: 2,
        interviewed: 1,
        offers: 0,
        hired: 0,
        selectionRate: 0,
      },
      {
        category: 'pacific_islander',
        label: 'Pacific Islander',
        applications: 1,
        interviewed: 0,
        offers: 0,
        hired: 0,
        selectionRate: 0,
      },
      {
        category: 'two_or_more',
        label: 'Two or More',
        applications: 2,
        interviewed: 1,
        offers: 0,
        hired: 0,
        selectionRate: 0,
      },
    ],
  },
]

const GENDER_SUMMARY = {
  male: { applications: 380, hired: 52, rate: 13.7 },
  female: { applications: 85, hired: 12, rate: 14.1 },
  nonBinary: { applications: 15, hired: 2, rate: 13.3 },
  declined: { applications: 10, hired: 2, rate: 20.0 },
}

const VETERAN_SUMMARY = {
  protectedVeteran: { applications: 45, hired: 8, rate: 17.8 },
  nonVeteran: { applications: 405, hired: 56, rate: 13.8 },
  declined: { applications: 40, hired: 4, rate: 10.0 },
}

// ============================================================================
// Helper Components
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

function AdverseImpactBadge({ ratio }: { ratio: number }) {
  const { theme } = useThemeContext()
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

// ============================================================================
// Main Component
// ============================================================================

export function EEOReportScreen() {
  const { theme } = useThemeContext()
  const [period, setPeriod] = useState<ReportPeriod>('ytd')

  const periods: Array<{ value: ReportPeriod; label: string }> = [
    { value: 'q1', label: 'Q1' },
    { value: 'q2', label: 'Q2' },
    { value: 'q3', label: 'Q3' },
    { value: 'q4', label: 'Q4' },
    { value: 'ytd', label: 'YTD' },
  ]

  // Compute totals
  const totals = useMemo(() => {
    let applications = 0
    let hired = 0
    for (const group of MOCK_JOB_GROUPS) {
      applications += group.totalApplications
      hired += group.totalHired
    }
    return { applications, hired, jobGroups: MOCK_JOB_GROUPS.length }
  }, [])

  // Compute adverse impact (4/5ths rule)
  const adverseImpactAnalysis = useMemo(() => {
    const maxRate = Math.max(
      GENDER_SUMMARY.male.rate,
      GENDER_SUMMARY.female.rate,
      GENDER_SUMMARY.nonBinary.rate
    )
    return {
      maleRatio: GENDER_SUMMARY.male.rate / maxRate,
      femaleRatio: GENDER_SUMMARY.female.rate / maxRate,
      nonBinaryRatio: GENDER_SUMMARY.nonBinary.rate / maxRate,
    }
  }, [])

  // The summary tile used to hardcode "0". It agreed with the ratios only by
  // coincidence, and would have kept reading 0 once real data landed.
  const adverseImpactFlagCount = useMemo(
    () => Object.values(adverseImpactAnalysis).filter((ratio) => ratio < 0.8).length,
    [adverseImpactAnalysis]
  )

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {USES_SAMPLE_DATA && (
          <SampleDataNotice
            title="Sample data — not a compliance record"
            description="Every figure on this page is illustrative placeholder data, including the adverse-impact ratios. Do not file, export, or cite these numbers."
          />
        )}

        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <H2>EEO/OFCCP Compliance Reports</H2>
            <Text style={{ color: colors.text[theme].secondary }}>
              Equal Employment Opportunity and OFCCP applicant flow reporting
            </Text>
          </Stack>
          {/* Export is the vector by which fabricated figures leave this screen
              and turn into a document someone might file. Disabled until the
              numbers are real (#535). */}
          <Button variant="outline" size="sm" iconStart={Download} disabled={USES_SAMPLE_DATA}>
            {USES_SAMPLE_DATA ? 'Export unavailable' : 'Export Report'}
          </Button>
        </Row>

        {/* Compliance Status Banner */}
        {!USES_SAMPLE_DATA && (
          <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].selected }}>
            <Row gap={12} align="center">
              <ShieldCheck size={24} color={colors.fg[theme].success} />
              <Stack flex={1}>
                <Text style={{ fontWeight: '600', color: colors.fg[theme].success }}>
                  Compliance Status: Active
                </Text>
                <Text style={{ fontSize: 13, color: colors.fg[theme].success }}>
                  All EEO-1 data collection is enabled. Next filing deadline: September 30, 2026
                </Text>
              </Stack>
            </Row>
          </Card>
        )}

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
            sublabel={`${((totals.hired / totals.applications) * 100).toFixed(1)}% rate`}
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
                {MOCK_JOB_GROUPS.map((group) => (
                  <Card key={group.jobCode} variant="glass" padding="md">
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
                            {group.jobGroup}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                            SOC {group.jobCode} • {group.totalApplications} applicants •{' '}
                            {group.totalHired} hired
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
                              {cat.label}
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
                              {cat.selectionRate.toFixed(1)}%
                            </Text>
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
                    {[
                      {
                        label: 'Male',
                        data: GENDER_SUMMARY.male,
                        ratio: adverseImpactAnalysis.maleRatio,
                      },
                      {
                        label: 'Female',
                        data: GENDER_SUMMARY.female,
                        ratio: adverseImpactAnalysis.femaleRatio,
                      },
                      {
                        label: 'Non-Binary',
                        data: GENDER_SUMMARY.nonBinary,
                        ratio: adverseImpactAnalysis.nonBinaryRatio,
                      },
                    ].map((row) => (
                      <Row
                        key={row.label}
                        gap={0}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                          backgroundColor: colors.bg[theme].subtle,
                        }}
                      >
                        <Text style={{ flex: 2, fontSize: 13, color: colors.text[theme].primary }}>
                          {row.label}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.applications}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.hired}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.rate.toFixed(1)}%
                        </Text>
                        <Stack style={{ flex: 1, alignItems: 'center' }}>
                          <AdverseImpactBadge ratio={row.ratio} />
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
                    {[
                      { label: 'Protected Veteran', data: VETERAN_SUMMARY.protectedVeteran },
                      { label: 'Non-Veteran', data: VETERAN_SUMMARY.nonVeteran },
                      { label: 'Declined to State', data: VETERAN_SUMMARY.declined },
                    ].map((row) => (
                      <Row
                        key={row.label}
                        gap={0}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                          backgroundColor: colors.bg[theme].subtle,
                        }}
                      >
                        <Text style={{ flex: 2, fontSize: 13, color: colors.text[theme].primary }}>
                          {row.label}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.applications}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.hired}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].secondary,
                            textAlign: 'center',
                          }}
                        >
                          {row.data.rate.toFixed(1)}%
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

                {MOCK_JOB_GROUPS.map((group) => {
                  const stages = ['Applied', 'Interviewed', 'Offered', 'Hired'] as const
                  const stageKeys = ['applications', 'interviewed', 'offers', 'hired'] as const

                  return (
                    <Card key={group.jobCode} variant="glass" padding="md">
                      <Stack gap={12}>
                        <Text
                          style={{
                            fontWeight: '600',
                            fontSize: 15,
                            color: colors.text[theme].primary,
                          }}
                        >
                          {group.jobGroup} — Applicant Flow
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
                                  const categoryColors: Record<EEOCategory, string> = {
                                    hispanic: '#3b82f6',
                                    white: '#6366f1',
                                    black: '#8b5cf6',
                                    asian: '#ec4899',
                                    native_american: '#f59e0b',
                                    pacific_islander: '#10b981',
                                    two_or_more: '#64748b',
                                  }

                                  return (
                                    <Stack
                                      key={cat.category}
                                      style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        backgroundColor: categoryColors[cat.category],
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
                            const categoryColors: Record<EEOCategory, string> = {
                              hispanic: '#3b82f6',
                              white: '#6366f1',
                              black: '#8b5cf6',
                              asian: '#ec4899',
                              native_american: '#f59e0b',
                              pacific_islander: '#10b981',
                              two_or_more: '#64748b',
                            }
                            return (
                              <Row key={cat.category} gap={4} align="center">
                                <Stack
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: categoryColors[cat.category],
                                  }}
                                />
                                <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>
                                  {cat.label}
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
