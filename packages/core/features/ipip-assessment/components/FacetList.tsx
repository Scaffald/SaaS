import type {
  IPIPFacetScore,
  IPIPResultFacets,
} from '@app/core/features/personality-assessment/lib/ipip'
import { memo } from 'react'
import { Text, XStack, YStack } from '@unicornlove/ui'

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
    <YStack gap="$3" marginTop="$3">
      {facetKeys.map((facetKey) => {
        const facetScore = facets[facetKey]
        const facetNarrative = facetNarratives[facetKey as keyof IPIPResultFacets]

        if (!facetScore || !facetNarrative) return null

        // Facet narratives from JSON have structure: { title, text }
        // The text is a general description, not specific to low/neutral/high

        return (
          <YStack
            key={facetKey}
            gap="$2"
            padding="$3"
            backgroundColor="$color2"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                {facetNarrative.title || facetKey}
              </Text>
              <Text
                fontSize="$3"
                fontWeight="600"
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
            </XStack>
            {facetNarrative.text && (
              <Text fontSize="$3" color="$color12">
                {facetNarrative.text}
              </Text>
            )}
          </YStack>
        )
      })}
    </YStack>
  )
})
