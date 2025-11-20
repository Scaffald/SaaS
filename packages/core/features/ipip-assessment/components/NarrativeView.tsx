import type {
  IPIPDomain,
  IPIPResults,
  IPIPScores,
} from '@app/core/features/personality-assessment/lib/ipip'
import { Text, YStack } from 'tamagui'
import { DOMAIN_ORDER } from '../utils/domainGrouping'
import { generateOverallSummary } from '../utils/narrativeGenerator'
import type { NormalizedScores } from '../utils/scoreNormalizer'
import { DomainCard } from './DomainCard'

export interface NarrativeViewProps {
  scores: IPIPScores | null
  normalizedScores: NormalizedScores | null
  narratives: IPIPResults | null
  isComplete: boolean
  completedDomains: number
}

/**
 * NarrativeView - Displays overall summary and 5 domain cards
 */
export function NarrativeView({
  scores,
  normalizedScores,
  narratives,
  isComplete,
  completedDomains,
}: NarrativeViewProps) {
  // Handle missing data gracefully - show partial results if available
  if (!scores && completedDomains === 0) {
    return (
      <YStack gap="$4" p="$4" items="center" aria-live="polite">
        <Text fontSize="$4" color="$color11">
          No results available yet. Complete at least one domain to see results.
        </Text>
      </YStack>
    )
  }

  // Generate summary only if we have scores
  const overallSummary = scores ? generateOverallSummary(scores) : null

  return (
    <YStack gap="$6" width="100%">
      {/* Overall Summary - only show if we have scores and narratives */}
      {overallSummary && (
        <YStack gap="$3" p="$5" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
          <Text fontSize="$6" fontWeight="bold" color="$blue11">
            Your Personality Profile
          </Text>
          <Text fontSize="$4" color="$blue10" lineHeight="$5">
            {overallSummary}
          </Text>
        </YStack>
      )}

      {/* Show message if summary unavailable but we have partial data */}
      {!overallSummary && completedDomains > 0 && (
        <YStack
          gap="$2"
          p="$4"
          bg="$blue2"
          rounded="$4"
          borderWidth={1}
          borderColor="$blue7"
          aria-live="polite"
        >
          <Text fontSize="$4" fontWeight="600" color="$blue11">
            Partial Results
          </Text>
          <Text fontSize="$3" color="$blue10">
            Complete more domains to see your full personality profile summary.
          </Text>
        </YStack>
      )}

      {/* Domain Cards */}
      <YStack gap="$4">
        {DOMAIN_ORDER.map((domain) => {
          const domainScore = scores?.[domain] ?? null
          const normalizedDomainScore = normalizedScores?.[domain]
          const domainNarrative = narratives?.[domain]
          const domainIndex = DOMAIN_ORDER.indexOf(domain)
          const domainIsComplete = domainIndex < completedDomains

          return (
            <DomainCard
              key={domain}
              domain={domain}
              score={domainScore}
              normalizedScore={normalizedDomainScore?.percentage || null}
              narrative={domainNarrative || null}
              isComplete={domainIsComplete}
            />
          )
        })}
      </YStack>

      {/* Partial Results Message */}
      {!isComplete && completedDomains > 0 && (
        <YStack gap="$2" p="$4" bg="$yellow2" rounded="$4" borderWidth={1} borderColor="$yellow7">
          <Text fontSize="$4" fontWeight="600" color="$yellow11">
            Complete Your Assessment
          </Text>
          <Text fontSize="$3" color="$yellow10">
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype.
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
