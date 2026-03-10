/**
 * Recommended Jobs Widget
 *
 * Displays top 5 recommended jobs based on multi-dimensional O*NET compatibility
 * scoring including skills, RIASEC, work values, and abilities.
 *
 * @see Issue #106 - O*NET Phase 6: Multi-Dimensional Job Matching
 */

import { Pressable } from 'react-native'
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StatusBadge } from '@scf/core/components/ui'
// Icons used in sub-components via color tokens only
import { useRouter } from 'expo-router'
import { ROUTES } from '@scf/core/constants/routes'
import { useOccupationStatus, useRIASECStatus } from '@scf/core/utils/onet-sdk-hooks'

// ============================================================================
// Types
// ============================================================================

interface RecommendedJob {
  id: string
  title: string
  company: string
  location: string
  total_score: number
  match_breakdown: {
    skills: number
    riasec: number
    work_values: number
    abilities: number
    experience: number
  }
  match_reasons: string[]
  pay_range?: string
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_RECOMMENDED_JOBS: RecommendedJob[] = [
  {
    id: 'job-1',
    title: 'Senior Electrician',
    company: 'Apex Construction',
    location: 'Denver, CO',
    total_score: 92,
    match_breakdown: { skills: 28, riasec: 14, work_values: 9, abilities: 13, experience: 28 },
    match_reasons: ['Strong skill overlap', 'Matching RIASEC profile', 'Experience level fit'],
    pay_range: '$35-45/hr',
  },
  {
    id: 'job-2',
    title: 'Lead Electrician',
    company: 'Summit Power Co.',
    location: 'Boulder, CO',
    total_score: 87,
    match_breakdown: { skills: 25, riasec: 13, work_values: 8, abilities: 14, experience: 27 },
    match_reasons: ['High skill match', 'Work values alignment'],
    pay_range: '$40-50/hr',
  },
  {
    id: 'job-3',
    title: 'Electrical Supervisor',
    company: 'National Grid Services',
    location: 'Remote',
    total_score: 81,
    match_breakdown: { skills: 22, riasec: 12, work_values: 9, abilities: 12, experience: 26 },
    match_reasons: ['Career advancement', 'Transferable skills'],
    pay_range: '$55-65/hr',
  },
  {
    id: 'job-4',
    title: 'Solar Installation Technician',
    company: 'GreenBuild Solar',
    location: 'Fort Collins, CO',
    total_score: 76,
    match_breakdown: { skills: 20, riasec: 11, work_values: 8, abilities: 12, experience: 25 },
    match_reasons: ['Related field', 'Growing industry'],
    pay_range: '$30-40/hr',
  },
  {
    id: 'job-5',
    title: 'Maintenance Electrician',
    company: 'Metro Facilities',
    location: 'Denver, CO',
    total_score: 73,
    match_breakdown: { skills: 21, riasec: 10, work_values: 7, abilities: 11, experience: 24 },
    match_reasons: ['Skill overlap', 'Location match'],
    pay_range: '$32-42/hr',
  },
]

// ============================================================================
// Helpers
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 85) return colors.success[500]
  if (score >= 70) return colors.blue[500]
  if (score >= 50) return colors.warning[500]
  return colors.gray[500]
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Good'
  return 'Fair'
}

// ============================================================================
// Sub-Components
// ============================================================================

function MatchScoreBar({ score, maxScore, label }: { score: number; maxScore: number; label: string }) {
  const { theme } = useThemeContext()
  const pct = Math.round((score / maxScore) * 100)

  return (
    <Row gap={6} align="center">
      <Text style={{ width: 64, color: colors.text[theme].tertiary, fontSize: 10 }}>{label}</Text>
      <Stack style={{ flex: 1, height: 4, backgroundColor: colors.bg[theme].muted, borderRadius: 2 }}>
        <Stack style={{ width: `${pct}%`, height: 4, backgroundColor: colors.fg[theme].active, borderRadius: 2 }} />
      </Stack>
      <Text style={{ width: 24, textAlign: 'right', color: colors.text[theme].tertiary, fontSize: 10 }}>{score}</Text>
    </Row>
  )
}

function JobRecommendationCard({ job, onPress }: { job: RecommendedJob; onPress: () => void }) {
  const { theme } = useThemeContext()
  const scoreColor = getScoreColor(job.total_score)

  return (
    <Pressable onPress={onPress}>
      <Stack
        gap={8}
        padding="sm"
        style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 10 }}
      >
        <Row gap={10} align="flex-start">
          <Stack
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: `${scoreColor}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: scoreColor, fontWeight: '700', fontSize: 14 }}>{job.total_score}</Text>
          </Stack>
          <Stack style={{ flex: 1 }} gap={2}>
            <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 14 }}>
              {job.title}
            </Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>
              {job.company} · {job.location}
            </Text>
            {job.pay_range && (
              <Text style={{ color: colors.fg[theme].active, fontSize: 12, fontWeight: '500' }}>
                {job.pay_range}
              </Text>
            )}
          </Stack>
          <StatusBadge variant={job.total_score >= 85 ? 'success' : 'default'}>
            {getScoreLabel(job.total_score)}
          </StatusBadge>
        </Row>

        {/* Match breakdown bars */}
        <Stack gap={2} style={{ paddingLeft: 46 }}>
          <MatchScoreBar score={job.match_breakdown.skills} maxScore={30} label="Skills" />
          <MatchScoreBar score={job.match_breakdown.riasec} maxScore={15} label="RIASEC" />
          <MatchScoreBar score={job.match_breakdown.experience} maxScore={30} label="Experience" />
        </Stack>

        {/* Top match reasons */}
        <Row gap={4} style={{ paddingLeft: 46, flexWrap: 'wrap' }}>
          {job.match_reasons.slice(0, 2).map((reason) => (
            <Stack key={reason} style={{ backgroundColor: colors.bg[theme].default, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: colors.border[theme].default }}>
              <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>{reason}</Text>
            </Stack>
          ))}
        </Row>
      </Stack>
    </Pressable>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RecommendedJobsWidget() {
  const router = useRouter()
  const { isLoading: occLoading } = useOccupationStatus()
  const { data: riasecStatus, isLoading: riasecLoading } = useRIASECStatus()

  if (occLoading || riasecLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  // Only show if user has completed career assessment
  if (!riasecStatus?.isCompleted) {
    return null
  }

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Recommended Jobs"
        action={
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)}
          >
            View All
          </Button>
        }
      />

      <Stack gap={6}>
        {MOCK_RECOMMENDED_JOBS.map((job) => (
          <JobRecommendationCard
            key={job.id}
            job={job}
            onPress={() => router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL.path.replace(':id', job.id))}
          />
        ))}
      </Stack>
    </DashboardWidget>
  )
}
