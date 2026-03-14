import type { IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'
import { BarChart, useThemeContext } from '@scaffald/ui'
import { useMemo } from 'react'
import { View } from 'react-native'
import { Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()

  // Handle missing data gracefully
  if (!scores && completedDomains === 0) {
    return (
      <Stack gap={16} padding="md" align="center">
        <Text style={{ color: colors.text[theme].secondary }}>
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
          padding="lg"
          backgroundColor={theme === 'light' ? colors.blue[50] : colors.blue[900]}
          borderRadius={16}
          borderWidth={2}
          borderColor={theme === 'light' ? colors.blue[400] : colors.blue[500]}
          align="center"
        >
          <Text style={{ color: theme === 'light' ? colors.blue[700] : colors.blue[300] }}>Your Archetype</Text>
          <Text style={{ color: theme === 'light' ? colors.blue[800] : colors.blue[200] }}>{archetype.name}</Text>
          {archetype.confidence !== undefined && (
            <Row gap={8} align="center">
              <Text style={{ color: theme === 'light' ? colors.blue[600] : colors.blue[400] }}>Confidence:</Text>
              <Text style={{ color: theme === 'light' ? colors.blue[700] : colors.blue[300] }}>{archetype.confidence}%</Text>
            </Row>
          )}
        </Stack>
      )}

      {/* Big Five Radar Chart */}
      <Stack
        gap={12}
        padding="md"
        backgroundColor={colors.bg[theme].subtle}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[theme].default}
      >
        <Text style={{ color: colors.text[theme].secondary }}>Big Five Personality Traits</Text>
        <Text style={{ color: colors.text[theme].secondary }}>Your scores across the five major personality domains (0-100%)</Text>
        <Stack align="center" padding="md">
          <BarChart
            data={radarData.map((d) => d.value)}
            height={300}
            width={300}
            variant="3"
          />
        </Stack>
        {/* Domain Labels with Scores */}
        <Stack gap={8} marginTop={8}>
          {topTraits.map((trait) => {
            const resultColor =
              trait.result === 'high'
                ? colors.green[600]
                : trait.result === 'low'
                  ? colors.blue[600]
                  : colors.text[theme].tertiary

            return (
              <Row
                key={trait.domainName}
                justify="space-between"
                align="center"
                padding="xs"
                backgroundColor={colors.bg[theme].default}
                borderRadius={8}
              >
                <Text style={{ color: colors.text[theme].secondary }}>{trait.domainName}</Text>
                <Row gap={12} align="center">
                  <Text style={{ color: colors.text[theme].secondary }}>{trait.value}%</Text>
                  <Text style={{ color: resultColor }}>{trait.result.toUpperCase()}</Text>
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
                padding="md"
                backgroundColor={colors.bg[theme].subtle}
                borderRadius={16}
                borderWidth={1}
                borderColor={colors.border[theme].default}
                style={{ opacity: 0.6 }}
                accessibilityLiveRegion="polite"
              >
                <Text style={{ color: colors.text[theme].tertiary }}>{domainName} Facets</Text>
                <Text style={{ color: colors.text[theme].tertiary }}>Complete {domainName} questions to see facet details.</Text>
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
              padding="md"
              backgroundColor={colors.bg[theme].subtle}
              borderRadius={16}
              borderWidth={1}
              borderColor={colors.border[theme].default}
            >
              <Text style={{ color: colors.text[theme].secondary }}>{domainName} Facets</Text>
              <Text style={{ color: colors.text[theme].secondary }}>Six sub-traits within {domainName} (0-100%)</Text>
              <BarChart
                data={facetData.map((d) => d.value)}
                height={200}
                width={280}
                variant="3"
              />
              {/* Facet Labels */}
              <Row wrap gap={8} marginTop={8}>
                {facetKeys.map((facetKey) => {
                  const facet = domainScore.facet[facetKey as keyof typeof domainScore.facet]
                  if (!facet) return null

                  const average = facet.score / facet.count
                  const percentage = Math.round(((average - 1) / 4) * 100)
                  const result = facet.result
                  const resultColor =
                    result === 'high'
                      ? colors.green[600]
                      : result === 'low'
                        ? colors.blue[600]
                        : colors.text[theme].tertiary

                  return (
                    <Row
                      key={facetKey}
                      gap={8}
                      padding="xs"
                      backgroundColor={colors.bg[theme].default}
                      borderRadius={8}
                      align="center"
                      justify="center"
                      style={{ minWidth: 80 }}
                    >
                      <Text style={{ color: colors.text[theme].secondary }}>F{facetKey}</Text>
                      <Text style={{ color: resultColor }}>{percentage}%</Text>
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
          padding="md"
          backgroundColor={theme === 'light' ? colors.yellow[50] : colors.yellow[900]}
          borderRadius={16}
          borderWidth={1}
          borderColor={theme === 'light' ? colors.yellow[200] : colors.yellow[700]}
          accessibilityLiveRegion="polite"
        >
          <Text style={{ color: theme === 'light' ? colors.yellow[700] : colors.yellow[300] }}>Complete Your Assessment</Text>
          <Text style={{ color: theme === 'light' ? colors.yellow[600] : colors.yellow[400] }}>
            You've completed {completedDomains} of 5 domains. Finish the remaining questions to see
            your complete personality profile and archetype visualization.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
