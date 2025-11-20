import type { IPIPDomain, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { BarChart, RadarChart } from '@app/ui'
import { VisuallyHidden } from '@tamagui/visually-hidden'
import { useMemo } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { DOMAIN_NAMES, DOMAIN_ORDER } from '../utils/domainGrouping'
import type { NormalizedScores } from '../utils/scoreNormalizer'

export interface ArchetypeResult {
  archetype: string
  name: string
  confidence: number
}

export interface ChartViewProps {
  scores: IPIPScores | null
  normalizedScores: NormalizedScores | null
  archetype: ArchetypeResult | null
  isComplete: boolean
  completedDomains: number
}

/**
 * ChartView - Displays IPIP results with radar chart, facet bars, and archetype badge
 */
export function ChartView({
  scores,
  normalizedScores,
  archetype,
  isComplete,
  completedDomains,
}: ChartViewProps) {
  // Handle missing data gracefully
  if (!scores && completedDomains === 0) {
    return (
      <YStack gap="$4" p="$4" items="center">
        <Text fontSize="$4" color="$color11">
          No chart data available yet. Complete at least one domain to see visualizations.
        </Text>
      </YStack>
    )
  }

  // Prepare radar chart data for Big Five domains
  const radarData = useMemo(() => {
    return DOMAIN_ORDER.map((domain) => {
      const normalized = normalizedScores?.[domain]
      const domainScore = scores?.[domain]
      const domainName = DOMAIN_NAMES[domain]

      let value = 0
      if (normalized?.percentage !== undefined) {
        value = normalized.percentage
      } else if (domainScore && domainScore.count > 0) {
        // Fallback: calculate percentage from raw score
        const average = domainScore.score / domainScore.count
        value = Math.round(((average - 1) / 4) * 100)
      }

      return {
        value,
        label: domainName.substring(0, 3),
        result: normalized?.result ?? domainScore?.result ?? 'neutral',
        domainName,
      }
    })
  }, [normalizedScores, scores])

  const radarSummaryText = useMemo(
    () =>
      radarData
        .map(
          (data) =>
            `${data.domainName}: ${data.value}% (${
              data.result === 'neutral' ? 'balanced' : data.result
            }).`
        )
        .join(' '),
    [radarData]
  )

  const topTraits = useMemo(() => {
    return [...radarData].sort((a, b) => b.value - a.value).slice(0, 3)
  }, [radarData])

  return (
    <YStack gap="$6" width="100%">
      {/* Accessible summary for assistive technologies */}
      <VisuallyHidden>
        <Text>
          {`Radar chart summary. ${radarSummaryText || 'No radar data available. Please continue the assessment.'}`}
        </Text>
      </VisuallyHidden>

      {/* Archetype Badge */}
      {isComplete && archetype && (
        <YStack
          gap="$3"
          p="$5"
          bg="$blue2"
          rounded="$4"
          borderWidth={2}
          borderColor="$blue9"
          items="center"
        >
          <Text fontSize="$6" fontWeight="bold" color="$blue11">
            Your Archetype
          </Text>
          <Text fontSize="$8" fontWeight="bold" color="$blue12">
            {archetype.name}
          </Text>
          {archetype.confidence !== undefined && (
            <XStack gap="$2" items="center">
              <Text fontSize="$4" color="$blue10">
                Confidence:
              </Text>
              <Text fontSize="$5" fontWeight="600" color="$blue11">
                {archetype.confidence}%
              </Text>
            </XStack>
          )}
        </YStack>
      )}

      {/* Big Five Radar Chart */}
      <YStack gap="$3" p="$4" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <Text fontSize="$5" fontWeight="bold" color="$color12">
          Big Five Personality Traits
        </Text>
        <Text fontSize="$3" color="$color11">
          Your scores across the five major personality domains (0-100%)
        </Text>
        <YStack items="center" p="$4">
          <RadarChart
            data={radarData}
            height={300}
            width={300}
            maxValue={100}
            noOfSections={5}
            isAnimated={true}
            animationDuration={1000}
            color="$blue9"
            strokeWidth={2}
            gridColor="$gray7"
            labelColor="$color11"
            labelTextSize={12}
          />
        </YStack>
        {/* Domain Labels with Scores */}
        <YStack gap="$2" mt="$2">
          {topTraits.map((trait) => {
            const resultColor =
              trait.result === 'high' ? '$green10' : trait.result === 'low' ? '$blue10' : '$gray10'

            return (
              <XStack
                key={trait.domainName}
                justify="space-between"
                items="center"
                p="$2"
                bg="$color1"
                rounded="$2"
              >
                <Text fontSize="$4" fontWeight="500" color="$color12">
                  {trait.domainName}
                </Text>
                <XStack gap="$3" items="center">
                  <Text fontSize="$3" color="$color10">
                    {trait.value}%
                  </Text>
                  <Text fontSize="$2" fontWeight="600" color={resultColor}>
                    {trait.result.toUpperCase()}
                  </Text>
                </XStack>
              </XStack>
            )
          })}
        </YStack>
      </YStack>

      {/* Facet Bars for Each Domain */}
      <YStack gap="$4">
        {DOMAIN_ORDER.map((domain) => {
          const domainScore = scores?.[domain]
          const domainName = DOMAIN_NAMES[domain]
          const domainIndex = DOMAIN_ORDER.indexOf(domain)
          const domainIsComplete = domainIndex < completedDomains

          if (!domainIsComplete || !domainScore?.facet) {
            return (
              <YStack
                key={domain}
                gap="$2"
                p="$4"
                bg="$gray2"
                rounded="$4"
                borderWidth={1}
                borderColor="$gray7"
                opacity={0.6}
                aria-live="polite"
              >
                <Text fontSize="$4" fontWeight="600" color="$gray10">
                  {domainName} Facets
                </Text>
                <Text fontSize="$3" color="$gray9">
                  Complete {domainName} questions to see facet details.
                </Text>
              </YStack>
            )
          }

          // Prepare facet bar chart data
          const facetKeys = Object.keys(domainScore.facet).sort()
          const facetData = facetKeys.map((facetKey) => {
            const facet = domainScore.facet[facetKey as keyof typeof domainScore.facet]
            if (!facet) return { value: 0, label: facetKey }

            // Calculate percentage (facet scores are also 1-5 average)
            const average = facet.score / facet.count
            const percentage = ((average - 1) / 4) * 100

            return {
              value: Math.round(percentage),
              label: `F${facetKey}`, // F1, F2, etc.
            }
          })

          return (
            <YStack
              key={domain}
              gap="$3"
              p="$4"
              bg="$color2"
              rounded="$4"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text fontSize="$5" fontWeight="bold" color="$color12">
                {domainName} Facets
              </Text>
              <Text fontSize="$3" color="$color11">
                Six sub-traits within {domainName} (0-100%)
              </Text>
              <BarChart
                data={facetData}
                height={200}
                maxValue={100}
                noOfSections={5}
                isAnimated={true}
                animationDuration={800}
                spacing={8}
                barWidth={30}
                roundedTop={true}
                roundedBottom={true}
              />
              {/* Facet Labels */}
              <XStack flexWrap="wrap" gap="$2" mt="$2">
                {facetKeys.map((facetKey) => {
                  const facet = domainScore.facet[facetKey as keyof typeof domainScore.facet]
                  if (!facet) return null

                  const average = facet.score / facet.count
                  const percentage = Math.round(((average - 1) / 4) * 100)
                  const result = facet.result
                  const resultColor =
                    result === 'high' ? '$green10' : result === 'low' ? '$blue10' : '$gray10'

                  return (
                    <XStack
                      key={facetKey}
                      gap="$2"
                      p="$2"
                      bg="$color1"
                      rounded="$2"
                      items="center"
                      justify="center"
                      style={{ minWidth: 80 }}
                    >
                      <Text fontSize="$2" fontWeight="600" color="$color10">
                        F{facetKey}
                      </Text>
                      <Text fontSize="$2" color={resultColor}>
                        {percentage}%
                      </Text>
                    </XStack>
                  )
                })}
              </XStack>
            </YStack>
          )
        })}
      </YStack>

      {/* Partial Results Message */}
      {!isComplete && completedDomains > 0 && (
        <YStack
          gap="$2"
          p="$4"
          bg="$yellow2"
          rounded="$4"
          borderWidth={1}
          borderColor="$yellow7"
          aria-live="polite"
        >
          <Text fontSize="$4" fontWeight="600" color="$yellow11">
            Complete Your Assessment
          </Text>
          <Text fontSize="$3" color="$yellow10">
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype visualization.
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
