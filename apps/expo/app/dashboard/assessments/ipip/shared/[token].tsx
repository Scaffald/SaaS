import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Text, Tabs, YStack } from 'tamagui'
import { useState, useMemo } from 'react'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { NarrativeView } from '@app/core/features/ipip-assessment/components/NarrativeView'
import { ChartView } from '@app/core/features/ipip-assessment/components/ChartView'
import { getScore, getResults } from '@app/core/features/personality-assessment/lib/ipip'
import { normalizeScores } from '@app/core/features/ipip-assessment/utils/scoreNormalizer'
import type { IPIPAnswer } from '@app/core/features/personality-assessment/lib/ipip'

/**
 * Shared IPIP Results Page Route
 * Public route for viewing shared IPIP assessment results via token
 */
export default function SharedIPIPResultsRoute() {
  const router = useRouter()
  const { token } = useLocalSearchParams<{ token: string }>()
  const [activeTab, setActiveTab] = useState<'narrative' | 'chart'>('narrative')

  const {
    data: sharedResults,
    isLoading,
    error,
  } = api.personalityAssessment.getSharedResults.useQuery(
    { token: token || '' },
    {
      enabled: !!token,
      retry: false,
    }
  )

  // Process shared results data
  const processedResults = useMemo(() => {
    if (!sharedResults?.answers) return null

    const answers = sharedResults.answers as IPIPAnswer[]
    if (!answers || answers.length === 0) return null

    const scores = getScore({ answers })
    const normalizedScores = normalizeScores(scores)
    const narratives = getResults()

    return {
      scores,
      normalizedScores,
      narratives,
      archetype: sharedResults.archetype,
    }
  }, [sharedResults])

  if (isLoading) {
    return (
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$color11">
          Loading shared results...
        </Text>
      </YStack>
    )
  }

  if (error || !sharedResults) {
    return (
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$red10" fontWeight="600">
          {error?.message || 'Results Not Found'}
        </Text>
        <Text fontSize="$4" color="$color11">
          This share link may be invalid, expired, or revoked.
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD.path)}>Return to Dashboard</Button>
      </YStack>
    )
  }

  return (
    <YStack gap="$6" width="100%" p="$4" style={{ maxWidth: 1000, alignSelf: 'center' }}>
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Shared Personality Results
        </Text>
        <Text fontSize="$4" color="$color11">
          Viewing shared Big Five personality assessment results.
        </Text>
      </YStack>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'narrative' | 'chart')}
        orientation="horizontal"
        flexDirection="column"
      >
        <Tabs.List
          separator={<YStack width="$1" />}
          disablePassBorderRadius="bottom"
          aria-label="Manage your personality results view"
        >
          <Tabs.Tab flex={1} value="narrative">
            <Text fontSize="$4" fontWeight="600">
              Narrative View
            </Text>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="chart">
            <Text fontSize="$4" fontWeight="600">
              Chart View
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="narrative" p="$4">
          <YStack bg="$color1" rounded="$4" borderWidth={1} borderColor="$borderColor" p="$4">
          {processedResults ? (
            <NarrativeView
              scores={processedResults.scores}
              normalizedScores={processedResults.normalizedScores}
              narratives={processedResults.narratives}
              isComplete={true}
              completedDomains={5}
            />
          ) : (
            <YStack items="center" p="$4">
              <Text fontSize="$4" color="$color11">
                Processing results...
              </Text>
            </YStack>
          )}
          </YStack>
        </Tabs.Content>

        <Tabs.Content value="chart" p="$4">
          <YStack bg="$color1" rounded="$4" borderWidth={1} borderColor="$borderColor" p="$4">
          {processedResults ? (
            <ChartView
              scores={processedResults.scores}
              normalizedScores={processedResults.normalizedScores}
              archetype={
                processedResults.archetype
                  ? {
                      archetype: processedResults.archetype.name || '',
                      confidence: processedResults.archetype.confidence || 0,
                    }
                  : null
              }
              isComplete={true}
              completedDomains={5}
            />
          ) : (
            <YStack items="center" p="$4">
              <Text fontSize="$4" color="$color11">
                Processing results...
              </Text>
            </YStack>
          )}
          </YStack>
        </Tabs.Content>
      </Tabs>
    </YStack>
  )
}
