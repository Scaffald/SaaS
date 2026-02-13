import type { IPIPResults, IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'
import { Text, Stack } from '@unicornlove/beyond-ui'
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
      <Stack gap={16} padding="md" align="center" aria-live="polite">
        <Text color="$gray11">
          No results available yet. Complete at least one domain to see results.
        </Text>
      </Stack>
    )
  }

  // Generate summary only if we have scores
  const overallSummary = scores ? generateOverallSummary(scores) : null

  return (
    <Stack gap={24} width="100%">
      {/* Overall Summary - only show if we have scores and narratives */}
      {overallSummary && (
        <Stack
          gap={12}
          padding="lg"
          backgroundColor="$blue2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$blue7"
        >
          <Text color="$blue11">Your Personality Profile</Text>
          <Text color="$blue10" lineHeight={20}>
            {overallSummary}
          </Text>
        </Stack>
      )}

      {/* Show message if summary unavailable but we have partial data */}
      {!overallSummary && completedDomains > 0 && (
        <Stack
          gap={8}
          padding="md"
          backgroundColor="$blue2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$blue7"
          aria-live="polite"
        >
          <Text color="$blue11">Partial Results</Text>
          <Text color="$blue10">
            Complete more domains to see your full personality profile summary.
          </Text>
        </Stack>
      )}

      {/* Domain Cards */}
      <Stack gap={16}>
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
      </Stack>

      {/* Partial Results Message */}
      {!isComplete && completedDomains > 0 && (
        <Stack
          gap={8}
          padding="md"
          backgroundColor="$yellow2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$yellow7"
        >
          <Text color="$yellow11">Complete Your Assessment</Text>
          <Text color="$yellow10">
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
