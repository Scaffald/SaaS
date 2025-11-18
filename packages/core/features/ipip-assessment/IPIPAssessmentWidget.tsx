import { useRouter } from 'expo-router'
import { YStack, Text, Spinner, XStack, Progress } from 'tamagui'
import { DashboardWidget, UIButton as StyledButton, spacing } from '@app/ui'
import { ArrowRight, CheckCircle2 } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { useIPIPResults } from './hooks/useIPIPResults'
import { DOMAIN_NAMES, DOMAIN_ORDER, getCompletedDomainsCount } from './utils/domainGrouping'
import type { IPIPAnswer } from '@app/core/features/personality-assessment/lib/ipip'

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
        <YStack gap={spacing.sm} items="center" py={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11">Loading...</Text>
        </YStack>
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
    router.push(ROUTES.DASHBOARD_ASSESSMENT_IPIP.path)
  }

  const handleViewResults = () => {
    router.push('/dashboard/assessments/ipip/results')
  }

  // Show results preview when completed
  if (isCompleted && results.isComplete && results.archetype) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.md}>
          <XStack justify="space-between" items="center">
            <YStack gap={spacing.xs} flex={1}>
              <XStack items="center" gap="$2">
                <CheckCircle2 size="$1" color="$green10" />
                <Text fontSize="$6" fontWeight="bold" color="$color12">
                  Personality Assessment
                </Text>
              </XStack>
              <Text fontSize="$3" color="$color11">
                Your Big Five personality profile is complete
              </Text>
            </YStack>
          </XStack>

          {/* Results Preview */}
          <YStack gap={spacing.sm} p="$3" bg="$color2" rounded="$3" borderWidth={1} borderColor="$borderColor">
            <XStack justify="space-between" items="center">
              <YStack gap="$1" flex={1}>
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
              </YStack>
            </XStack>

            {/* Top 3 Domain Scores Preview */}
            {results.normalizedScores && (
              <YStack gap="$2" mt="$2">
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
                    <XStack key={domain} justify="space-between" items="center" gap="$2">
                      <Text fontSize="$3" color="$color11" flex={1}>
                        {domainName}
                      </Text>
                      <Progress value={percentage} max={100} size="$1" width={100}>
                        <Progress.Indicator animation="bouncy" />
                      </Progress>
                      <Text fontSize="$2" fontWeight="600" color="$color10" minWidth={45}>
                        {percentage}%
                      </Text>
                      <Text
                        fontSize="$2"
                        fontWeight="600"
                        color={
                          result === 'high'
                            ? '$green10'
                            : result === 'low'
                              ? '$blue10'
                              : '$gray10'
                        }
                        minWidth={50}
                      >
                        {result.toUpperCase()}
                      </Text>
                    </XStack>
                  )
                })}
              </YStack>
            )}
          </YStack>

          <StyledButton variant="primary" onPress={handleViewResults} size="$5">
            <StyledButton.Text>View Full Results</StyledButton.Text>
            <ArrowRight size="$1" />
          </StyledButton>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show progress/CTA when in progress or not started
  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Assessment
          </Text>
          <Text fontSize="$3" color="$color11">
            Answer 120 questions to discover your personality traits using the Big Five personality
            model.
          </Text>
        </YStack>

        {/* Progress Bar */}
        {hasStarted && (
          <YStack gap="$2">
            <XStack justify="space-between" items="center">
              <Text fontSize="$3" fontWeight="500" color="$color11">
                Progress
              </Text>
              <Text fontSize="$3" color="$color10">
                {progress}/120 ({progressPercentage}%)
              </Text>
            </XStack>
            <Progress value={progressPercentage} max={100}>
              <Progress.Indicator animation="bouncy" />
            </Progress>
            {completedDomains > 0 && (
              <Text fontSize="$2" color="$color10">
                {completedDomains} of 5 domains completed
              </Text>
            )}
          </YStack>
        )}

        <StyledButton variant="primary" onPress={handleStart} size="$5">
          <StyledButton.Text>
            {hasStarted ? 'Continue Questions' : 'Start Questions'}
          </StyledButton.Text>
        </StyledButton>

        <Text fontSize="$2" color="$color11">
          {hasStarted
            ? `${progress}/120 questions answered`
            : 'Takes about 10-15 minutes'}
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
