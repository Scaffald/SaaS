import { ROUTES } from '@scf/core/constants/routes'
import type { IPIPAnswer } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { Button, DashboardWidget, useThemeContext } from '@scaffald/ui'
import { ArrowRight, CheckCircle2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { ProgressBar, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { useIPIPResults } from './hooks/useIPIPResults'
import { DOMAIN_NAMES, DOMAIN_ORDER, getCompletedDomainsCount } from './utils/domainGrouping'

/**
 * IPIPAssessmentWidget - Dashboard widget with CTA and results preview
 */
export function IPIPAssessmentWidget() {
  useThemeContext()
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
          <Spinner size="lg" color="primary" />
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
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Stack gap={4} flex={1}>
              <Row align="center" gap={8}>
                <CheckCircle2 size={16} color="$green10" />
                <Text color="$gray11">Personality Assessment</Text>
              </Row>
              <Text color="$gray11" style={{ flex: 1 }}>Your Big Five personality profile is complete</Text>
            </Stack>
          </Row>

          {/* Results Preview */}
          <Stack
            gap={8}
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
                      <Text color="$gray11" style={{ flex: 1 }}>
                        {domainName}
                      </Text>
                      <ProgressBar value={percentage} />
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
        <Stack gap={4}>
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
            <ProgressBar value={progressPercentage} />
            {completedDomains > 0 && (
              <Text color="$gray11">{completedDomains} of 5 domains completed</Text>
            )}
          </Stack>
        )}

        <Button variant="filled" color="primary" onPress={handleStart} size="lg">
          {hasStarted ? 'Continue Questions' : 'Start Questions'}
        </Button>

        <Text color="$gray11">
          {hasStarted ? `${progress}/120 questions answered` : 'Takes about 10-15 minutes'}
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
