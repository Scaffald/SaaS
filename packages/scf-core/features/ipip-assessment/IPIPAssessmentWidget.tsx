import { ROUTES } from '@scf/core/constants/routes'
import type { IPIPAnswer } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { Button, DashboardWidget, spacing, useThemeContext } from '@scaffald/ui'
import { ArrowRight, CheckCircle2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Progress, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { useIPIPResults } from './hooks/useIPIPResults'
import { DOMAIN_NAMES, DOMAIN_ORDER, getCompletedDomainsCount } from './utils/domainGrouping'

/**
 * IPIPAssessmentWidget - Dashboard widget with CTA and results preview
 */
export function IPIPAssessmentWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { data: statusData, isLoading } = useIPIPStatus()
  const { data: assessmentData } = useAssessmentStatus()
  const results = useIPIPResults()

  const status = statusData?.data
  const assessment = assessmentData?.data

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.sm} align="center" paddingVertical={40}>
          <Spinner size="lg" color="$blue7" />
          <Text color="$gray11">Loading...</Text>
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
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path)
  }

  const handleViewResults = () => {
    router.push(ROUTES.DASHBOARD.ASSESSMENTS.IPIP.RESULTS.path)
  }

  // Show results preview when completed
  if (isCompleted && results.isComplete && results.archetype) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md}>
          <Row justify="space-between" align="center">
            <Stack gap={spacing.xs} flex={1}>
              <Row align="center" gap={8}>
                <CheckCircle2 size={4} color="$green10" />
                <Text color="$gray11">Personality Assessment</Text>
              </Row>
              <Text color="$gray11">Your Big Five personality profile is complete</Text>
            </Stack>
          </Row>

          {/* Results Preview */}
          <Stack
            gap={spacing.sm}
            padding="sm"
            backgroundColor="$color2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Row justify="space-between" align="center">
              <Stack gap={4} flex={1}>
                <Text color="$gray11">Your Archetype</Text>
                <Text color="$blue11">{results.archetype.name}</Text>
                {results.archetype.confidence > 0 && (
                  <Text color="$gray11">{results.archetype.confidence}% confidence</Text>
                )}
              </Stack>
            </Row>

            {/* Top 3 Domain Scores Preview */}
            {results.normalizedScores && (
              <Stack gap={8} marginTop={8}>
                <Text color="$gray11">Top Traits</Text>
                {DOMAIN_ORDER.slice(0, 3).map((domain) => {
                  const normalized = results.normalizedScores?.[domain]
                  if (!normalized) return null

                  const domainName = DOMAIN_NAMES[domain]
                  const percentage = normalized.percentage
                  const result = normalized.result

                  return (
                    <Row key={domain} justify="space-between" align="center" gap={8}>
                      <Text color="$gray11" flex={1}>
                        {domainName}
                      </Text>
                      <Progress value={percentage} max={100} size={4} width={100}>
                        <Progress.Indicator animation="bouncy" />
                      </Progress>
                      <Text color="$gray11" style={{ minWidth: 45 }}>
                        {percentage}%
                      </Text>
                      <Text
                        color={
                          result === 'high' ? '$green10' : result === 'low' ? '$blue10' : '$gray10'
                        }
                        style={{ minWidth: 50 }}
                      >
                        {result.toUpperCase()}
                      </Text>
                    </Row>
                  )
                })}
              </Stack>
            )}
          </Stack>

          <Button variant="primary" onPress={handleViewResults} size="lg">
            <Button.Text>View Full Results</Button.Text>
            <ArrowRight size={4} />
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show progress/CTA when in progress or not started
  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="$gray11">Personality Assessment</Text>
          <Text color="$gray11">
            Answer 120 questions to discover your personality traits using the Big Five personality
            model.
          </Text>
        </Stack>

        {/* Progress Bar */}
        {hasStarted && (
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Text color="$gray11">Progress</Text>
              <Text color="$gray11">
                {progress}/120 ({progressPercentage}%)
              </Text>
            </Row>
            <Progress
              value={progressPercentage}
              max={100}
              aria-label="Overall personality assessment progress"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <Progress.Indicator animation="bouncy" />
            </Progress>
            {completedDomains > 0 && (
              <Text color="$gray11">{completedDomains} of 5 domains completed</Text>
            )}
          </Stack>
        )}

        <Button variant="primary" onPress={handleStart} size="lg">
          <Button.Text>{hasStarted ? 'Continue Questions' : 'Start Questions'}</Button.Text>
        </Button>

        <Text color="$gray11">
          {hasStarted ? `${progress}/120 questions answered` : 'Takes about 10-15 minutes'}
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
