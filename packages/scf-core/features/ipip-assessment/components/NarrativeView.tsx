import type { IPIPResults, IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'
import { Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  // Handle missing data gracefully - show partial results if available
  if (!scores && completedDomains === 0) {
    return (
      <Stack gap={16} padding="md" align="center" accessibilityLiveRegion="polite">
        <Text color={colors.text[t].secondary}>
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
          backgroundColor={t === 'dark' ? colors.blue[900] : colors.blue[50]}
          borderRadius={16}
          borderWidth={1}
          borderColor={t === 'dark' ? colors.blue[700] : colors.blue[300]}
        >
          <Text color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>Your Personality Profile</Text>
          <Text color={t === 'dark' ? colors.blue[300] : colors.blue[600]} style={{ lineHeight: 20 }}>
            {overallSummary}
          </Text>
        </Stack>
      )}

      {/* Show message if summary unavailable but we have partial data */}
      {!overallSummary && completedDomains > 0 && (
        <Stack
          gap={8}
          padding="md"
          backgroundColor={t === 'dark' ? colors.blue[900] : colors.blue[50]}
          borderRadius={16}
          borderWidth={1}
          borderColor={t === 'dark' ? colors.blue[700] : colors.blue[300]}
          accessibilityLiveRegion="polite"
        >
          <Text color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>Partial Results</Text>
          <Text color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>
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
          backgroundColor={t === 'dark' ? colors.yellow[900] : colors.yellow[50]}
          borderRadius={16}
          borderWidth={1}
          borderColor={t === 'dark' ? colors.yellow[700] : colors.yellow[300]}
        >
          <Text color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]}>Complete Your Assessment</Text>
          <Text color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]}>
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
