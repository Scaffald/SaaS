import type { IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'
import { BarChart, SkillsChart } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { View } from 'react-native'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { DOMAIN_NAMES, DOMAIN_ORDER } from '../utils/domainGrouping'
import type { NormalizedScores } from '../utils/scoreNormalizer'

// VisuallyHidden replacement - hides content visually but keeps it accessible to screen readers
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <View
    style={{
      position: 'absolute',
      width: 1,
      height: 1,
      margin: -1,
      padding: 0,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: 0,
    }}
    accessibilityElementsHidden={false}
    importantForAccessibility="yes"
  >
    {children}
  </View>
)

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
      <Stack gap={16} padding={16} align="center">
        <Text color="gray">
          No chart data available yet. Complete at least one domain to see visualizations.
        </Text>
      </Stack>
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
    <Stack gap={24} width="100%">
      {/* Accessible summary for assistive technologies */}
      <VisuallyHidden>
        <Text>
          {`Radar chart summary. ${radarSummaryText || 'No radar data available. Please continue the assessment.'}`}
        </Text>
      </VisuallyHidden>

      {/* Archetype Badge */}
      {isComplete && archetype && (
        <Stack
          gap={12}
          padding={20}
          backgroundColor="$blue2"
          borderRadius={16}
          borderWidth={2}
          borderColor="$blue9"
          align="center"
        >
          <Text color="$blue11">
            Your Archetype
          </Text>
          <Text color="$blue12">
            {archetype.name}
          </Text>
          {archetype.confidence !== undefined && (
            <Row gap={8} align="center">
              <Text color="$blue10">
                Confidence:
              </Text>
              <Text color="$blue11">
                {archetype.confidence}%
              </Text>
            </Row>
          )}
        </Stack>
      )}

      {/* Big Five Radar Chart */}
      <Stack
        gap={12}
        padding={16}
        backgroundColor="$color2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text color="gray">
          Big Five Personality Traits
        </Text>
        <Text color="gray">
          Your scores across the five major personality domains (0-100%)
        </Text>
        <Stack align="center" padding={16}>
          <SkillsChart
            datasets={[
              {
                label: 'Big Five',
                data: radarData,
                fillColor: '$blue4',
                strokeColor: '$blue9',
                strokeWidth: 2,
                fillOpacity: 0.02,
                gradient: {
                  startColor: '$blue8',
                  endColor: '$blue4',
                },
              },
            ]}
            height={300}
            width={300}
            maxValue={100}
            isAnimated={true}
            backgroundColor="transparent"
            gridColor="$color5"
            labelColor="$color11"
            labelTextSize={12}
            showDots={true}
          />
        </Stack>
        {/* Domain Labels with Scores */}
        <Stack gap={8} marginTop={8}>
          {topTraits.map((trait) => {
            const resultColor =
              trait.result === 'high' ? '$green10' : trait.result === 'low' ? '$blue10' : '$gray10'

            return (
              <Row
                key={trait.domainName}
                justify="space-between"
                align="center"
                padding={8}
                backgroundColor="$color1"
                borderRadius={8}
              >
                <Text color="gray">
                  {trait.domainName}
                </Text>
                <Row gap={12} align="center">
                  <Text color="gray">
                    {trait.value}%
                  </Text>
                  <Text color={resultColor}>
                    {trait.result.toUpperCase()}
                  </Text>
                </Row>
              </Row>
            )
          })}
        </Stack>
      </Stack>

      {/* Facet Bars for Each Domain */}
      <Stack gap={16}>
        {DOMAIN_ORDER.map((domain) => {
          const domainScore = scores?.[domain]
          const domainName = DOMAIN_NAMES[domain]
          const domainIndex = DOMAIN_ORDER.indexOf(domain)
          const domainIsComplete = domainIndex < completedDomains

          if (!domainIsComplete || !domainScore?.facet) {
            return (
              <Stack
                key={domain}
                gap={8}
                padding={16}
                backgroundColor="$gray2"
                borderRadius={16}
                borderWidth={1}
                borderColor="$gray7"
                opacity={0.6}
                aria-live="polite"
              >
                <Text color="$gray10">
                  {domainName} Facets
                </Text>
                <Text color="$gray9">
                  Complete {domainName} questions to see facet details.
                </Text>
              </Stack>
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
            <Stack
              key={domain}
              gap={12}
              padding={16}
              backgroundColor="$color2"
              borderRadius={16}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="gray">
                {domainName} Facets
              </Text>
              <Text color="gray">
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
              <Row flexWrap="wrap" gap={8} marginTop={8}>
                {facetKeys.map((facetKey) => {
                  const facet = domainScore.facet[facetKey as keyof typeof domainScore.facet]
                  if (!facet) return null

                  const average = facet.score / facet.count
                  const percentage = Math.round(((average - 1) / 4) * 100)
                  const result = facet.result
                  const resultColor =
                    result === 'high' ? '$green10' : result === 'low' ? '$blue10' : '$gray10'

                  return (
                    <Row
                      key={facetKey}
                      gap={8}
                      padding={8}
                      backgroundColor="$color1"
                      borderRadius={8}
                      align="center"
                      justify="center"
                      style={{ minWidth: 80 }}
                    >
                      <Text color="gray">
                        F{facetKey}
                      </Text>
                      <Text color={resultColor}>
                        {percentage}%
                      </Text>
                    </Row>
                  )
                })}
              </Row>
            </Stack>
          )
        })}
      </Stack>

      {/* Partial Results Message */}
      {!isComplete && completedDomains > 0 && (
        <Stack
          gap={8}
          padding={16}
          backgroundColor="$yellow2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$yellow7"
          aria-live="polite"
        >
          <Text color="$yellow11">
            Complete Your Assessment
          </Text>
          <Text color="$yellow10">
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype visualization.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
