import type {
  IPIPFacetScore,
  IPIPResultFacets,
} from '@scf/core/features/personality-assessment/lib/ipip'
import { memo } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface FacetListProps {
  facets: Record<string, IPIPFacetScore>
  facetNarratives: IPIPResultFacets
}

/**
 * FacetList - Displays 6 facets for a domain with scores and narratives
 */
export const FacetList = memo(function FacetList({ facets, facetNarratives }: FacetListProps) {
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
            padding={12}
            backgroundColor="$color2"
            borderRadius={12}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Row justify="space-between" align="center">
              <Text color="gray">{facetNarrative.title || facetKey}</Text>
              <Text
                color={
                  facetScore.result === 'high'
                    ? '$green10'
                    : facetScore.result === 'low'
                      ? '$blue10'
                      : '$gray10'
                }
              >
                {facetScore.result.toUpperCase()}
              </Text>
            </Row>
            {facetNarrative.text && <Text color="gray">{facetNarrative.text}</Text>}
          </Stack>
        )
      })}
    </Stack>
  )
})
