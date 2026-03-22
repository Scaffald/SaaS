/**
 * Gap Analysis Widget - Compares worker skills against job requirements
 * Shows which skills need improvement for target occupations.
 */

import {
  DashboardWidget,
  DashboardWidgetHeader,
  Button,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { BarChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { AlertTriangle, CheckCircle2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { ROUTES } from '../../../constants/routes'
import { useSoftSkills } from '../../../utils/profile-skills-sdk-hooks'
import type { SoftSkillCategory } from '@scaffald/sdk'

const CATEGORY_LABELS: Record<SoftSkillCategory, string> = {
  reliability: 'Reliability',
  collaboration: 'Collaboration',
  professionalism: 'Professionalism',
  technical: 'Technical',
}

// Target thresholds for "job-ready" per category
const TARGET_LEVELS: Record<SoftSkillCategory, number> = {
  reliability: 3.5,
  collaboration: 3.0,
  professionalism: 3.5,
  technical: 3.0,
}

interface GapItem {
  category: SoftSkillCategory
  label: string
  current: number
  target: number
  gap: number
}

export function GapAnalysisWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: skillsData, isLoading, error } = useSoftSkills()

  if (error) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Gap Analysis" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
            Unable to load gap analysis
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  if (!skillsData?.categoryAverages) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Gap Analysis" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            Complete your skills assessment to see gap analysis.
          </Text>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
          >
            Assess Skills
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const categories = Object.keys(TARGET_LEVELS) as SoftSkillCategory[]

  const gaps: GapItem[] = categories
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      current: skillsData.categoryAverages[cat] ?? 0,
      target: TARGET_LEVELS[cat],
      gap: TARGET_LEVELS[cat] - (skillsData.categoryAverages[cat] ?? 0),
    }))
    .sort((a, b) => b.gap - a.gap)

  const hasGaps = gaps.some((g) => g.gap > 0.1)

  // Bar chart data: current values
  const barData = gaps.map((g) => Math.round((g.current / 5) * 100))

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Gap Analysis"
        action={
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
          >
            My Skills
          </Button>
        }
      />

      {/* Visual bar comparison */}
      <Stack paddingVertical={8}>
        <BarChart data={barData} height={100} />
      </Stack>

      {/* Gap items */}
      <Stack gap={4}>
        {gaps.map((item) => {
          const isMet = item.gap <= 0.1
          return (
            <Row
              key={item.category}
              gap={8}
              align="center"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 8,
              }}
            >
              {isMet ? (
                <CheckCircle2 size={14} color={colors.green[500]} />
              ) : (
                <AlertTriangle size={14} color={colors.warning[500]} />
              )}

              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: colors.text[theme].primary,
                }}
              >
                {item.label}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: isMet ? colors.green[500] : colors.warning[500],
                  fontWeight: '600',
                }}
              >
                {item.current.toFixed(1)} / {item.target.toFixed(1)}
              </Text>
            </Row>
          )
        })}
      </Stack>

      {!hasGaps && (
        <Stack
          align="center"
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: colors.green[50],
            borderRadius: 6,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.green[700], fontWeight: '600' }}>
            All skill targets met!
          </Text>
        </Stack>
      )}
    </DashboardWidget>
  )
}
