import type {
  IPIPFacetScore,
  IPIPResultFacets,
} from '@scf/core/features/personality-assessment/lib/ipip'
import { memo } from 'react'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface FacetListProps {
  facets: Record<string, IPIPFacetScore>
  facetNarratives: IPIPResultFacets
}

/**
 * FacetList - Displays 6 facets for a domain with scores and narratives
 */
export const FacetList = memo(function FacetList({ facets, facetNarratives }: FacetListProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const facetKeys = Object.keys(facets).sort()

  return (
    <Stack gap={12} marginTop={12}>
      {facetKeys.map((facetKey) => {
        const facetScore = facets[facetKey]
        const facetNarrative = facetNarratives[facetKey as keyof IPIPResultFacets]

        if (!facetScore || !facetNarrative) return null

        // Facet narratives from JSON have structure: { title, text }
        // The text is a general description, not specific to low/neutral/high

        return (
          <Stack
            key={facetKey}
            gap={8}
            padding="sm"
            style={{
              backgroundColor: colors.bg[t].muted,
              borderWidth: 1,
              borderColor: colors.border[t].default,
            }}
            borderRadius={12}
          >
            <Row justify="space-between" align="center">
              <Text style={{ color: colors.text[t].secondary }}>{facetNarrative.title || facetKey}</Text>
              <Text
                style={{
                  color:
                    facetScore.result === 'high'
                      ? t === 'dark' ? colors.green[300] : colors.green[600]
                      : facetScore.result === 'low'
                        ? t === 'dark' ? colors.blue[300] : colors.blue[600]
                        : colors.text[t].secondary,
                }}
              >
                {facetScore.result.toUpperCase()}
              </Text>
            </Row>
            {facetNarrative.text && <Text style={{ color: colors.text[t].secondary }}>{facetNarrative.text}</Text>}
          </Stack>
        )
      })}
    </Stack>
  )
})
