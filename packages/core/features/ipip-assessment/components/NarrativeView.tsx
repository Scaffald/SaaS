import { Text, YStack } from 'tamagui'
import { DomainCard } from './DomainCard'
import { generateOverallSummary } from '../utils/narrativeGenerator'
import { DOMAIN_ORDER } from '../utils/domainGrouping'
import type { IPIPDomain, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import type { IPIPResults } from '@app/core/features/personality-assessment/lib/ipip'
import type { NormalizedScores } from '../utils/scoreNormalizer'

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
  if (!scores || !normalizedScores || !narratives) {
    return (
      <YStack gap="$4" p="$4" items="center">
        <Text fontSize="$4" color="$color11">
          Loading results...
        </Text>
      </YStack>
    )
  }

  const overallSummary = generateOverallSummary(scores)

  return (
    <YStack gap="$6" width="100%">
      {/* Overall Summary */}
      <YStack gap="$3" p="$5" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
        <Text fontSize="$6" fontWeight="bold" color="$blue11">
          Your Personality Profile
        </Text>
        <Text fontSize="$4" color="$blue10" lineHeight="$5">
          {overallSummary}
        </Text>
      </YStack>

      {/* Domain Cards */}
      <YStack gap="$4">
        {DOMAIN_ORDER.map((domain) => {
          const domainScore = scores[domain]
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

