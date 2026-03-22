/**
 * Career Recommendations Widget - Shows top career matches based on RIASEC assessment.
 *
 * @see Issue #103
 */

import { Briefcase, ChevronRight, Target } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
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
import { useRIASECStatus, useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'

/** Match percentage color based on score */
function getMatchColor(score: number): string {
  if (score >= 80) return colors.success[500]
  if (score >= 60) return colors.blue[500]
  if (score >= 40) return colors.warning[500]
  return colors.error[500]
}

/** Compute simple match scores from RIASEC scores */
function computeRecommendations(
  scores: Record<string, number>
): Array<{ title: string; matchPercent: number; onetCode: string }> {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const topDimensions = sorted.slice(0, 3).map(([key]) => key)

  // Map RIASEC dimensions to representative occupations
  const dimensionCareers: Record<string, Array<{ title: string; onetCode: string; weight: number }>> = {
    realistic: [
      { title: 'Construction Manager', onetCode: '11-9021.00', weight: 95 },
      { title: 'Electrician', onetCode: '47-2111.00', weight: 90 },
      { title: 'Plumber', onetCode: '47-2152.00', weight: 85 },
    ],
    investigative: [
      { title: 'Civil Engineer', onetCode: '17-2051.00', weight: 92 },
      { title: 'Environmental Scientist', onetCode: '19-2041.00', weight: 88 },
      { title: 'Surveyor', onetCode: '17-1022.00', weight: 84 },
    ],
    artistic: [
      { title: 'Architect', onetCode: '17-1011.00', weight: 93 },
      { title: 'Landscape Architect', onetCode: '17-1012.00', weight: 87 },
      { title: 'Interior Designer', onetCode: '27-1025.00', weight: 82 },
    ],
    social: [
      { title: 'Safety Manager', onetCode: '11-9199.00', weight: 90 },
      { title: 'Training Coordinator', onetCode: '13-1151.00', weight: 86 },
      { title: 'HR Specialist', onetCode: '13-1071.00', weight: 81 },
    ],
    enterprising: [
      { title: 'Project Manager', onetCode: '11-9199.02', weight: 94 },
      { title: 'Cost Estimator', onetCode: '13-1051.00', weight: 89 },
      { title: 'Operations Manager', onetCode: '11-1021.00', weight: 85 },
    ],
    conventional: [
      { title: 'Building Inspector', onetCode: '47-4011.00', weight: 91 },
      { title: 'Compliance Officer', onetCode: '13-1041.00', weight: 86 },
      { title: 'Quantity Surveyor', onetCode: '13-1051.01', weight: 83 },
    ],
  }

  // Collect careers from top dimensions, weighted by RIASEC score
  const seen = new Set<string>()
  const recommendations: Array<{ title: string; matchPercent: number; onetCode: string }> = []

  for (const dim of topDimensions) {
    const dimScore = scores[dim] ?? 3
    const careers = dimensionCareers[dim] ?? []
    for (const career of careers) {
      if (seen.has(career.onetCode)) continue
      seen.add(career.onetCode)
      const matchPercent = Math.round((career.weight * dimScore) / 5)
      recommendations.push({ title: career.title, matchPercent, onetCode: career.onetCode })
    }
  }

  return recommendations.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 5)
}

export function CareerRecommendationsWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: riasecStatus, isLoading: riasecLoading } = useRIASECStatus()
  const { data: occupationStatus, isLoading: occLoading } = useOccupationStatus()

  if (riasecLoading || occLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Only show if RIASEC is completed
  if (!riasecStatus?.isCompleted || !riasecStatus.scores) {
    return null
  }

  const recommendations = computeRecommendations(riasecStatus.scores)
  const selectedOccupations = occupationStatus?.occupations ?? []

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Career Recommendations"
        action={
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(ROUTES.DASHBOARD.CAREER_EXPLORER.path)}
          >
            Explore All
          </Button>
        }
      />

      <Stack gap={8}>
        {recommendations.map((rec) => {
          const isSelected = selectedOccupations.some((o) => o.onet_code === rec.onetCode)
          return (
            <Pressable
              key={rec.onetCode}
              onPress={() => router.push(ROUTES.DASHBOARD.CAREER_EXPLORER.DETAIL.path.replace(':onetCode', rec.onetCode))}
            >
              <Row
                gap={12}
                align="center"
                padding="sm"
                style={{
                  backgroundColor: colors.bg[theme].subtle,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.border[theme].active : colors.border[theme].default,
                }}
              >
                <Stack
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: `${getMatchColor(rec.matchPercent)}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? (
                    <Target size={18} color={getMatchColor(rec.matchPercent)} />
                  ) : (
                    <Briefcase size={18} color={getMatchColor(rec.matchPercent)} />
                  )}
                </Stack>
                <Stack style={{ flex: 1 }}>
                  <Text style={{ color: colors.text[theme].primary }}>{rec.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                    {isSelected ? 'Target career' : rec.onetCode}
                  </Text>
                </Stack>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: getMatchColor(rec.matchPercent),
                  }}
                >
                  {rec.matchPercent}%
                </Text>
                <ChevronRight size={16} color={colors.icon[theme].default} />
              </Row>
            </Pressable>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
