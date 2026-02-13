import { ROUTES } from '@scf/core/constants/routes'
import { ChartView } from '@scf/core/features/ipip-assessment/components/ChartView'
import { NarrativeView } from '@scf/core/features/ipip-assessment/components/NarrativeView'
import { normalizeScores } from '@scf/core/features/ipip-assessment/utils/scoreNormalizer'
import type { IPIPAnswer } from '@scf/core/features/personality-assessment/lib/ipip'
import { getResults, getScore } from '@scf/core/features/personality-assessment/lib/ipip'
import { api } from '@scf/core/utils/api'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Tabs, Text, Stack } from '@unicornlove/beyond-ui'

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
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5,
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
      archetype: sharedResults.archetype,
      narratives,
      normalizedScores,
      scores,
    }
  }, [sharedResults])

  if (isLoading) {
    return (
      <Stack gap={16} padding={32} align="center">
        <Text color="$color11">
          Loading shared results...
        </Text>
      </Stack>
    )
  }

  if (error || !sharedResults) {
    return (
      <Stack gap={16} padding={32} align="center">
        <Text color="$red10" style={{ fontWeight: '600' }}>
          {error?.message || 'Results Not Found'}
        </Text>
        <Text color="$color11">
          This share link may be invalid, expired, or revoked.
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD.path)}>Return to Dashboard</Button>
      </Stack>
    )
  }

  return (
    <Stack gap={24} width="100%" padding={16} style={{ alignSelf: 'center', maxWidth: 1000 }}>
      {/* Header */}
      <Stack gap={8}>
        <Text style={{ fontWeight: 'bold' }} color="$color12">
          Shared Personality Results
        </Text>
        <Text color="$color11">
          Viewing shared Big Five personality assessment results.
        </Text>
      </Stack>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'narrative' | 'chart')}
        orientation="horizontal"
       
      >
        <Tabs.List
          separator={<Stack />}
          disablePassBorderRadius="bottom"
          aria-label="Manage your personality results view"
        >
          <Tabs.Tab value="narrative">
            <Text>
              Narrative View
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="chart">
            <Text>
              Chart View
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="narrative" padding={16}>
          <Stack
           
           
           
           
            padding={16}
          >
            {processedResults ? (
              <NarrativeView
                scores={processedResults.scores}
                normalizedScores={processedResults.normalizedScores}
                narratives={processedResults.narratives}
                isComplete={true}
                completedDomains={5}
              />
            ) : (
              <Stack align="center" padding={16}>
                <Text color="$color11">
                  Processing results...
                </Text>
              </Stack>
            )}
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="chart" padding={16}>
          <Stack
           
           
           
           
            padding={16}
          >
            {processedResults ? (
              <ChartView
                scores={processedResults.scores}
                normalizedScores={processedResults.normalizedScores}
                archetype={
                  processedResults.archetype
                    ? {
                        archetype: processedResults.archetype.name || '',
                        confidence: processedResults.archetype.confidence || 0,
                        name: processedResults.archetype.name || '',
                      }
                    : null
                }
                isComplete={true}
                completedDomains={5}
              />
            ) : (
              <Stack align="center" padding={16}>
                <Text color="$color11">
                  Processing results...
                </Text>
              </Stack>
            )}
          </Stack>
        </Tabs.Content>
      </Tabs>
    </Stack>
  )
}
