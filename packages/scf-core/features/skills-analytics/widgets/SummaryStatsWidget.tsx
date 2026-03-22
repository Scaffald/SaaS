/**
 * Summary Stats Widget - Grid of progress rings and stat cards
 * Shows overall average, per-category averages, evidence count, review count.
 */

import {
  DashboardWidget,
  DashboardWidgetHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { ProgressRing } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useSoftSkills, useSoftSkillsComparison } from '../../../utils/profile-skills-sdk-hooks'
import { useSkillEvidence } from '../../../utils/skill-analytics-sdk-hooks'
import type { SoftSkillCategory } from '@scaffald/sdk'

const CATEGORY_COLORS: Record<SoftSkillCategory, string> = {
  reliability: colors.blue[500],
  collaboration: colors.green[500],
  professionalism: colors.purple[500],
  technical: colors.orange[500],
}

const CATEGORY_LABELS: Record<SoftSkillCategory, string> = {
  reliability: 'Reliable',
  collaboration: 'Collab',
  professionalism: 'Profess.',
  technical: 'Technical',
}

function StatCard({
  label,
  value,
  theme,
}: {
  label: string
  value: string | number
  theme: 'light' | 'dark'
}) {
  return (
    <Stack
      align="center"
      gap={2}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: colors.bg[theme].subtle,
        flex: 1,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>{label}</Text>
    </Stack>
  )
}

export function SummaryStatsWidget() {
  const { theme } = useThemeContext()
  const { data: skillsData, isLoading } = useSoftSkills()
  const { data: comparisonData } = useSoftSkillsComparison()
  const { data: evidenceData } = useSkillEvidence()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  const categories = Object.keys(CATEGORY_COLORS) as SoftSkillCategory[]
  const overallAvg =
    categories.reduce(
      (sum, cat) => sum + (skillsData?.categoryAverages[cat] ?? 0),
      0
    ) / categories.length

  const overallPct = Math.round((overallAvg / 5) * 100)
  const evidenceCount = evidenceData?.evidence?.length ?? 0
  const reviewCount = comparisonData?.peerSampleSize ?? 0
  const alignmentScore = comparisonData?.alignmentScore
    ? Math.round(comparisonData.alignmentScore * 100)
    : null

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Summary" />

      {/* Overall progress ring */}
      <Stack align="center" paddingVertical={8}>
        <ProgressRing
          value={overallPct}
          label="Overall"
          size="lg"
          color={colors.primary[500]}
        />
      </Stack>

      {/* Category mini rings */}
      <Row gap={8} justify="center" paddingVertical={8} style={{ flexWrap: 'wrap' }}>
        {categories.map((cat) => {
          const avg = skillsData?.categoryAverages[cat] ?? 0
          const pct = Math.round((avg / 5) * 100)
          return (
            <Stack key={cat} align="center" gap={2}>
              <ProgressRing
                value={pct}
                size="sm"
                color={CATEGORY_COLORS[cat]}
              />
              <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </Stack>
          )
        })}
      </Row>

      {/* Stat cards row */}
      <Row gap={8} paddingTop={8}>
        <StatCard label="Evidence" value={evidenceCount} theme={theme} />
        <StatCard label="Reviews" value={reviewCount} theme={theme} />
        {alignmentScore !== null && (
          <StatCard label="Alignment" value={`${alignmentScore}%`} theme={theme} />
        )}
      </Row>
    </DashboardWidget>
  )
}
