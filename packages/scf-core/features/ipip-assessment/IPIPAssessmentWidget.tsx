import { ROUTES } from '@scf/core/constants/routes'
import type { IPIPAnswer } from '@scf/core/features/personality-assessment/lib/ipip'
import { api } from '@scf/core/utils/api'
import { Button, DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { ArrowRight, CheckCircle2 } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { Progress, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useIPIPResults } from './hooks/useIPIPResults'
import { DOMAIN_NAMES, DOMAIN_ORDER, getCompletedDomainsCount } from './utils/domainGrouping'

/**
 * IPIPAssessmentWidget - Dashboard widget with CTA and results preview
 */
export function IPIPAssessmentWidget() {
  const router = useRouter()

  const { data: status, isLoading } = api.personalityAssessment.getIPIPStatus.useQuery()
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()
  const results = useIPIPResults()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.sm} alignItems="center" paddingVertical={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11">Loading...</Text>
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
          <Row justifyContent="space-between" alignItems="center">
            <Stack gap={spacing.xs} flex={1}>
              <Row alignItems="center" gap="$2">
                <CheckCircle2 size="$1" color="$green10" />
                <Text fontSize="$6" fontWeight="bold" color="$color12">
                  Personality Assessment
                </Text>
              </Row>
              <Text fontSize="$3" color="$color11">
                Your Big Five personality profile is complete
              </Text>
            </Stack>
          </Row>

          {/* Results Preview */}
          <Stack
            gap={spacing.sm}
            padding="$3"
            backgroundColor="$color2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Row justifyContent="space-between" alignItems="center">
              <Stack gap="$1" flex={1}>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Your Archetype
                </Text>
                <Text fontSize="$5" fontWeight="bold" color="$blue11">
                  {results.archetype.name}
                </Text>
                {results.archetype.confidence > 0 && (
                  <Text fontSize="$2" color="$color10">
                    {results.archetype.confidence}% confidence
                  </Text>
                )}
              </Stack>
            </Row>

            {/* Top 3 Domain Scores Preview */}
            {results.normalizedScores && (
              <Stack gap="$2" marginTop="$2">
                <Text fontSize="$3" fontWeight="600" color="$color11">
                  Top Traits
                </Text>
                {DOMAIN_ORDER.slice(0, 3).map((domain) => {
                  const normalized = results.normalizedScores?.[domain]
                  if (!normalized) return null

                  const domainName = DOMAIN_NAMES[domain]
                  const percentage = normalized.percentage
                  const result = normalized.result

                  return (
                    <Row
                      key={domain}
                      justifyContent="space-between"
                      alignItems="center"
                      gap="$2"
                    >
                      <Text fontSize="$3" color="$color11" flex={1}>
                        {domainName}
                      </Text>
                      <Progress value={percentage} max={100} size="$1" width={100}>
                        <Progress.Indicator animation="bouncy" />
                      </Progress>
                      <Text
                        fontSize="$2"
                        fontWeight="600"
                        color="$color10"
                        style={{ minWidth: 45 }}
                      >
                        {percentage}%
                      </Text>
                      <Text
                        fontSize="$2"
                        fontWeight="600"
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

          <Button variant="primary" onPress={handleViewResults} size="$5">
            <Button.Text>View Full Results</Button.Text>
            <ArrowRight size="$1" />
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
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Assessment
          </Text>
          <Text fontSize="$3" color="$color11">
            Answer 120 questions to discover your personality traits using the Big Five personality
            model.
          </Text>
        </Stack>

        {/* Progress Bar */}
        {hasStarted && (
          <Stack gap="$2">
            <Row justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontWeight="500" color="$color11">
                Progress
              </Text>
              <Text fontSize="$3" color="$color10">
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
              <Text fontSize="$2" color="$color10">
                {completedDomains} of 5 domains completed
              </Text>
            )}
          </Stack>
        )}

        <Button variant="primary" onPress={handleStart} size="$5">
          <Button.Text>
            {hasStarted ? 'Continue Questions' : 'Start Questions'}
          </Button.Text>
        </Button>

        <Text fontSize="$2" color="$color11">
          {hasStarted ? `${progress}/120 questions answered` : 'Takes about 10-15 minutes'}
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
