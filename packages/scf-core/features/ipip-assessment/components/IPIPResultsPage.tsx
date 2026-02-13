import { ROUTES } from '@scf/core/constants/routes'
import { useAwardResultsViewXPMutation } from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, RefreshCcw } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Tabs, Text, Row, Stack } from '@scaffald/ui'
import { useIPIPResults } from '../hooks/useIPIPResults'
import { ChartView } from './ChartView'
import { NarrativeView } from './NarrativeView'
import { ShareResults } from './ShareResults'

/**
 * IPIPResultsPage - Main results page with Narrative and Chart views
 */
export function IPIPResultsPage() {
  const router = useRouter()
  const results = useIPIPResults()
  const [activeTab, setActiveTab] = useState<'narrative' | 'chart'>('narrative')
  const queryClient = useQueryClient()

  const awardXP = useAwardResultsViewXPMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    },
    onError: (error: { message?: string }) => {
      // Don't show error toast for XP - it's not critical
      console.error('Error awarding results view XP:', error)
    },
  })

  // Award +2 XP on first view
  useEffect(() => {
    if (!results.isLoading && results.isComplete) {
      awardXP.mutate()
    }
  }, [results.isLoading, results.isComplete, awardXP])

  if (results.isLoading) {
    return (
      <Stack gap={16} padding={32} align="center" aria-live="polite">
        <Text color="$gray11">Loading your results...</Text>
      </Stack>
    )
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
    queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'archetype'] })
  }

  // Handle critical errors (network, API failures)
  if (results.error && !results.hasPartialResults) {
    return (
      <Stack gap={16} padding={32} align="center" aria-live="assertive">
        <AlertCircle size="sm" color="$red10" />
        <Text color="$red10">Error Loading Results</Text>
        <Text color="$gray11" textAlign="center">
          {results.error.message || 'Unable to load your assessment results. Please try again.'}
        </Text>
        <Row gap={12}>
          <Button iconStart={RefreshCcw} onPress={handleRetry} color="primary">
            Retry
          </Button>
          <Button variant="outline" onPress={() => router.push(ROUTES.DASHBOARD.path)}>
            Return to Dashboard
          </Button>
        </Row>
      </Stack>
    )
  }

  // Handle case where no assessment has been started
  if (!results.scores && results.completedDomains === 0 && !results.isLoading) {
    return (
      <Stack gap={16} padding={32} align="center">
        <Text color="$gray11">No Results Yet</Text>
        <Text color="$gray11" textAlign="center">
          Complete the IPIP assessment to see your personality results.
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path)}>
          Start Assessment
        </Button>
      </Stack>
    )
  }

  // Show warnings for partial data errors but still display what we have
  const hasDataErrors = results.scoringError || results.normalizationError || results.narrativeError

  return (
    <Stack gap={24} width="100%" padding="md" style={{ maxWidth: 1000, alignSelf: 'center' }}>
      {/* Header */}
      <Stack gap={8}>
        <Text color="$gray11">Your Personality Results</Text>
        <Text color="$gray11">
          Discover your Big Five personality traits and how they shape your work style.
        </Text>
      </Stack>

      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'narrative' | 'chart')}
      >
        <Tabs.Item value="narrative">
          <Tabs.Trigger flex={1}>Narrative View</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="chart">
          <Tabs.Trigger flex={1}>Chart View</Tabs.Trigger>
        </Tabs.Item>

        <Tabs.Content value="narrative">
          <Stack
            padding="md"
            backgroundColor="$color1"
            borderBottomLeftRadius={16}
            borderBottomRightRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <NarrativeView
              scores={results.scores}
              normalizedScores={results.normalizedScores}
              narratives={results.narratives}
              isComplete={results.isComplete}
              completedDomains={results.completedDomains}
            />
          </Stack>
        </Tabs.Content>

        <Tabs.Content value="chart">
          <Stack
            padding="md"
            backgroundColor="$color1"
            borderBottomLeftRadius={16}
            borderBottomRightRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <ChartView
              scores={results.scores}
              normalizedScores={results.normalizedScores}
              archetype={
                results.archetype
                  ? {
                      archetype: results.archetype.name,
                      name: results.archetype.name,
                      confidence: results.archetype.confidence,
                    }
                  : null
              }
              isComplete={results.isComplete}
              completedDomains={results.completedDomains}
            />
          </Stack>
        </Tabs.Content>
      </Tabs>

      {/* Data Quality Warnings */}
      {hasDataErrors && (
        <Stack
          gap={8}
          padding="md"
          backgroundColor="$yellow2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$yellow7"
        >
          <Row align="center" gap={8}>
            <AlertCircle size={4} color="$yellow11" />
            <Text color="$yellow11">Partial Data Available</Text>
          </Row>
          <Text color="$yellow10">
            Some results may be incomplete. {results.scoringError && 'Scoring calculation failed. '}
            {results.normalizationError && 'Score normalization failed. '}
            {results.narrativeError && 'Narrative content unavailable. '}
            You can still view available results below.
          </Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
            onPress={handleRetry}
            marginTop={8}
          >
            Refresh Data
          </Button>
        </Stack>
      )}

      {/* Share Results Section */}
      {results.isComplete && (
        <ShareResults isComplete={results.isComplete} nextAvailableAt={results.nextAvailableAt} />
      )}
    </Stack>
  )
}
