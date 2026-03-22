import { ROUTES } from '@scf/core/constants/routes'
import type { IPIPAnswer } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { Button, DashboardWidget, DashboardWidgetHeader, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ArrowRight, CheckCircle2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { ProgressBar, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { useIPIPResults } from './hooks/useIPIPResults'
import { DOMAIN_NAMES, DOMAIN_ORDER, getCompletedDomainsCount } from './utils/domainGrouping'

/**
 * IPIPAssessmentWidget - Dashboard widget with CTA and results preview
 */
export function IPIPAssessmentWidget() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()

  const { data: statusData, isLoading } = useIPIPStatus()
  const { data: assessmentData } = useAssessmentStatus()
  const results = useIPIPResults()

  const status = (statusData as { data?: { isCompleted?: boolean; progress?: number } } | undefined)?.data
  const assessment = (assessmentData as { data?: { ipip_answers?: unknown } } | undefined)?.data

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={8} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  const progress = status?.progress || 0
  const hasStarted = progress > 0
  const isCompleted = status?.isCompleted || false
  const answersCount = (assessment?.ipip_answers as IPIPAnswer[])?.length || 0
  const completedDomains = getCompletedDomainsCount(answersCount)
  const progressPercentage = Math.round((progress / 120) * 100)

  const handleStart = () => {
    router.push(ROUTES.ASSESSMENTS.IPIP.path)
  }

  const handleViewResults = () => {
    router.push(ROUTES.ASSESSMENTS.IPIP.RESULTS.path)
  }

  // Show results preview when completed
  if (isCompleted && results.isComplete && results.archetype) {
    return (
      <DashboardWidget>
        <Stack gap={12}>
          <DashboardWidgetHeader title="Personality Assessment" />
          <Row justify="space-between" align="center">
            <Stack gap={4} flex={1}>
              <Row align="center" gap={8}>
                <CheckCircle2 size={16} color={colors.green[500]} />
                <Text style={{ color: colors.text[theme].secondary }}>
                  Your Big Five personality profile is complete
                </Text>
              </Row>
            </Stack>
          </Row>

          {/* Results Preview */}
          <Stack
            gap={8}
            padding="sm"
            style={{ backgroundColor: colors.bg[t].muted }}
            borderRadius={12}
            borderWidth={1}
            borderColor={colors.border[t].default}
          >
            <Row justify="space-between" align="center">
              <Stack gap={4} flex={1}>
                <Text style={{ color: colors.text[theme].secondary }}>Your Archetype</Text>
                <Text style={{ color: theme === 'light' ? colors.blue[700] : colors.blue[300] }}>
                  {results.archetype.name}
                </Text>
                {results.archetype.confidence > 0 && (
                  <Text style={{ color: colors.text[theme].secondary }}>
                    {results.archetype.confidence}% confidence
                  </Text>
                )}
              </Stack>
            </Row>

            {/* Top 3 Domain Scores Preview */}
            {results.normalizedScores && (
              <Stack gap={8} marginTop={8}>
                <Text style={{ color: colors.text[theme].primary }}>Top Traits</Text>
                {DOMAIN_ORDER.slice(0, 3).map((domain) => {
                  const normalized = results.normalizedScores?.[domain]
                  if (!normalized) return null

                  const domainName = DOMAIN_NAMES[domain]
                  const percentage = normalized.percentage
                  const result = normalized.result

                  return (
                    <Row key={domain} justify="space-between" align="center" gap={8}>
                      <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
                        {domainName}
                      </Text>
                      <ProgressBar value={percentage} />
                      <Text style={{ minWidth: 45, color: colors.text[theme].secondary }}>
                        {percentage}%
                      </Text>
                      <Text
                        style={{
                          minWidth: 50,
                          color:
                            result === 'high'
                              ? colors.green[600]
                              : result === 'low'
                                ? colors.blue[600]
                                : colors.text[theme].secondary,
                        }}
                      >
                        {result.toUpperCase()}
                      </Text>
                    </Row>
                  )
                })}
              </Stack>
            )}
          </Stack>

          <Button variant="filled" color="primary" onPress={handleViewResults} size="lg" iconEnd={ArrowRight}>
            View Full Results
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show progress/CTA when in progress or not started
  return (
    <DashboardWidget>
      <Stack gap={12}>
        <DashboardWidgetHeader title="Personality Assessment" />
        <Text style={{ color: colors.text[theme].secondary }}>
          Answer 120 questions to discover your personality traits using the Big Five personality
          model.
        </Text>

        {/* Progress Bar */}
        {hasStarted && (
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Text style={{ color: colors.text[theme].secondary }}>Progress</Text>
              <Text style={{ color: colors.text[theme].secondary }}>
                {progress}/120 ({progressPercentage}%)
              </Text>
            </Row>
            <ProgressBar value={progressPercentage} />
            {completedDomains > 0 && (
              <Text style={{ color: colors.text[theme].secondary }}>
                {completedDomains} of 5 domains completed
              </Text>
            )}
          </Stack>
        )}

        <Button variant="filled" color="primary" onPress={handleStart} size="lg">
          {hasStarted ? 'Continue Questions' : 'Start Questions'}
        </Button>

        <Text style={{ color: colors.text[theme].secondary }}>
          {hasStarted ? `${progress}/120 questions answered` : 'Takes about 10-15 minutes'}
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
