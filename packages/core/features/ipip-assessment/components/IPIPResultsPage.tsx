import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { NarrativeView } from './NarrativeView'
import { useIPIPResults } from '../hooks/useIPIPResults'

/**
 * IPIPResultsPage - Main results page with Narrative and Chart views
 */
export function IPIPResultsPage() {
  const router = useRouter()
  const toast = useToastController()
  const results = useIPIPResults()
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
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$color11">
          Loading your results...
        </Text>
      </YStack>
    )
  }

  if (results.error) {
    return (
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$red10" fontWeight="600">
          Error Loading Results
        </Text>
        <Text fontSize="$4" color="$color11">
          {results.error.message}
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD.path)}>Return to Dashboard</Button>
      </YStack>
    )
  }

  if (!results.scores && results.completedDomains === 0) {
    return (
      <YStack gap="$4" p="$8" items="center">
        <Text fontSize="$5" color="$color11" fontWeight="600">
          No Results Yet
        </Text>
        <Text fontSize="$4" color="$color10" text="center">
          Complete the IPIP assessment to see your personality results.
        </Text>
        <Button onPress={() => router.push(ROUTES.DASHBOARD.path)}>Start Assessment</Button>
      </YStack>
    )
  }

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
      <XStack gap="$2" borderBottomWidth={1} borderColor="$borderColor">
        <Button
          size="$4"
          variant="outlined"
          borderBottomWidth={2}
          borderBottomColor="$blue9"
          disabled
        >
          Narrative View
        </Button>
        <Button
          size="$4"
          variant="outlined"
          onPress={() => {
            // Chart View will be implemented in Task 6
            toast.show('Coming Soon', {
              message: 'Chart View will be available in the next update.',
            })
          }}
        >
          Chart View
        </Button>
      </XStack>

      {/* Narrative View */}
      <NarrativeView
        scores={results.scores}
        normalizedScores={results.normalizedScores}
        narratives={results.narratives}
        isComplete={results.isComplete}
        completedDomains={results.completedDomains}
      />

      {/* Archetype Notice */}
      {results.isComplete && results.archetype && (
        <YStack gap="$2" p="$4" bg="$green2" rounded="$4" borderWidth={1} borderColor="$green7">
          <Text fontSize="$4" fontWeight="600" color="$green11">
            Your Archetype: {results.archetype.name}
          </Text>
          <Text fontSize="$3" color="$green10">
            Confidence: {results.archetype.confidence}%
          </Text>
          <Text fontSize="$3" color="$green10">
            View the Chart tab to see your archetype details and visualization.
          </Text>
        </YStack>
      )}

      {/* Incomplete Notice */}
      {!results.isComplete && (
        <YStack gap="$2" p="$4" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
          <Text fontSize="$4" fontWeight="600" color="$blue11">
            Complete Your Assessment
          </Text>
          <Text fontSize="$3" color="$blue10">
            Finish all 120 questions to unlock your archetype classification and full results.
          </Text>
        </YStack>
      )}
    </YStack>
  )
}

