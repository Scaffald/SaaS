import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { Button, Text, Tabs, XStack, YStack } from 'tamagui'
import { AlertCircle, RefreshCcw } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { NarrativeView } from './NarrativeView'
import { ChartView } from './ChartView'
import { ShareResults } from './ShareResults'
import { useIPIPResults } from '../hooks/useIPIPResults'

/**
 * IPIPResultsPage - Main results page with Narrative and Chart views
 */
export function IPIPResultsPage() {
  const router = useRouter()
  const results = useIPIPResults()
  const [activeTab, setActiveTab] = useState<'narrative' | 'chart'>('narrative')
  const utils = api.useUtils()

  const awardXP = api.personalityAssessment.awardResultsViewXP.useMutation({
    onSuccess: () => {
      utils.personalityAssessment.getAssessmentStatus.invalidate()
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
      <YStack gap="$4" p="$8" items="center" aria-live="polite">
        <Text fontSize="$5" color="$color11">
          Loading your results...
        </Text>
      </YStack>
    )
  }

  const utils = api.useUtils()

  const handleRetry = () => {
    utils.personalityAssessment.getAssessmentStatus.invalidate()
    utils.personalityAssessment.getArchetype.invalidate()
  }

  // Handle critical errors (network, API failures)
  if (results.error && !results.hasPartialResults) {
    return (
      <YStack gap="$4" p="$8" items="center" aria-live="assertive">
        <AlertCircle size="$3" color="$red10" />
        <Text fontSize="$5" color="$red10" fontWeight="600">
          Error Loading Results
        </Text>
        <Text fontSize="$4" color="$color11" text="center">
          {results.error.message || 'Unable to load your assessment results. Please try again.'}
        </Text>
        <XStack gap="$3">
          <Button icon={RefreshCcw} onPress={handleRetry} theme="blue">
            Retry
          </Button>
          <Button variant="outlined" onPress={() => router.push(ROUTES.DASHBOARD.path)}>
            Return to Dashboard
          </Button>
        </XStack>
      </YStack>
    )
  }

  // Handle case where no assessment has been started
  if (!results.scores && results.completedDomains === 0 && !results.isLoading) {
    return (
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$color11" fontWeight="600">
          No Results Yet
        </Text>
        <Text fontSize="$4" color="$color10" text="center">
          Complete the IPIP assessment to see your personality results.
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD_ASSESSMENT_IPIP.path)}>
          Start Assessment
        </Button>
      </YStack>
    )
  }

  // Show warnings for partial data errors but still display what we have
  const hasDataErrors = results.scoringError || results.normalizationError || results.narrativeError

  return (
    <YStack gap="$6" width="100%" p="$4" style={{ maxWidth: 1000, alignSelf: 'center' }}>
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Your Personality Results
        </Text>
        <Text fontSize="$4" color="$color11">
          Discover your Big Five personality traits and how they shape your work style.
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

        <Tabs.Content value="narrative" p="$4" bg="$color1" roundedBottom="$4" borderWidth={1} borderColor="$borderColor">
          <NarrativeView
            scores={results.scores}
            normalizedScores={results.normalizedScores}
            narratives={results.narratives}
            isComplete={results.isComplete}
            completedDomains={results.completedDomains}
          />
        </Tabs.Content>

        <Tabs.Content value="chart" p="$4" bg="$color1" roundedBottom="$4" borderWidth={1} borderColor="$borderColor">
          <ChartView
            scores={results.scores}
            normalizedScores={results.normalizedScores}
            archetype={
              results.archetype
                ? {
                    archetype: results.archetype.name,
                    confidence: results.archetype.confidence,
                  }
                : null
            }
            isComplete={results.isComplete}
            completedDomains={results.completedDomains}
          />
        </Tabs.Content>
      </Tabs>

      {/* Data Quality Warnings */}
      {hasDataErrors && (
        <YStack gap="$2" p="$4" bg="$yellow2" rounded="$4" borderWidth={1} borderColor="$yellow7">
          <XStack items="center" gap="$2">
            <AlertCircle size="$1" color="$yellow11" />
            <Text fontSize="$4" fontWeight="600" color="$yellow11">
              Partial Data Available
            </Text>
          </XStack>
          <Text fontSize="$3" color="$yellow10">
            Some results may be incomplete. {results.scoringError && 'Scoring calculation failed. '}
            {results.normalizationError && 'Score normalization failed. '}
            {results.narrativeError && 'Narrative content unavailable. '}
            You can still view available results below.
          </Text>
          <Button size="$3" variant="outlined" icon={RefreshCcw} onPress={handleRetry} mt="$2">
            Refresh Data
          </Button>
        </YStack>
      )}

      {/* Share Results Section */}
      {results.isComplete && (
        <ShareResults isComplete={results.isComplete} nextAvailableAt={results.nextAvailableAt} />
      )}
    </YStack>
  )
}

