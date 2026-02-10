import type {
  IPIPDomain,
  IPIPResult,
  IPIPScore,
} from '@scf/core/features/personality-assessment/lib/ipip'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { memo, useState } from 'react'
import { Button, Progress, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { DOMAIN_NAMES } from '../utils/domainGrouping'
import { FacetList } from './FacetList'

export interface DomainCardProps {
  domain: IPIPDomain
  score: IPIPScore | null
  normalizedScore: number | null
  narrative: IPIPResult | null
  isComplete: boolean
}

/**
 * DomainCard - Expandable card showing domain score, narrative, and facets
 */
export const DomainCard = memo(function DomainCard({
  domain,
  score,
  normalizedScore,
  narrative,
  isComplete,
}: DomainCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const domainName = DOMAIN_NAMES[domain]
  const classification = score?.result || 'neutral'
  const percentage = normalizedScore || 0

  if (!isComplete) {
    return (
      <Stack
        gap="$3"
        padding="$4"
        backgroundColor="$color2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        opacity={0.6}
      >
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold" color="$color11">
            {domainName}
          </Text>
          <Text fontSize="$3" color="$color10">
            Incomplete
          </Text>
        </Row>
        <Text fontSize="$3" color="$color10">
          Complete {domainName} questions to unlock your results for this domain.
        </Text>
      </Stack>
    )
  }

  const domainResult = narrative?.results?.[classification as 'low' | 'neutral' | 'high']

  return (
    <Stack
      gap="$3"
      padding="$4"
      backgroundColor="$color2"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {/* Domain Header */}
      <Row justifyContent="space-between" alignItems="center">
        <Stack gap="$1" flex={1}>
          <Text fontSize="$5" fontWeight="bold" color="$color12">
            {domainName}
          </Text>
          <Text fontSize="$3" color="$color11">
            {narrative?.summary || ''}
          </Text>
        </Stack>
        <Stack alignItems="flex-end" gap="$1">
          <Text
            fontSize="$4"
            fontWeight="bold"
            color={
              classification === 'high'
                ? '$green10'
                : classification === 'low'
                  ? '$blue10'
                  : '$gray10'
            }
          >
            {classification.toUpperCase()}
          </Text>
          <Text fontSize="$3" color="$color10">
            {Math.round(percentage)}%
          </Text>
        </Stack>
      </Row>

      {/* Progress Bar */}
      <Progress value={percentage} max={100}>
        <Progress.Indicator animation="bouncy" />
      </Progress>

      {/* Domain Result Text */}
      {domainResult && (
        <Text fontSize="$3" color="$color12">
          {domainResult.text}
        </Text>
      )}

      {/* Expand/Collapse Button */}
      {score?.facet && narrative?.facets && (
        <Button
          size="$3"
          variant="outlined"
          onPress={() => setIsExpanded(!isExpanded)}
          icon={isExpanded ? ChevronUp : ChevronDown}
        >
          {isExpanded ? 'Hide Facets' : 'Show Facets'}
        </Button>
      )}

      {/* Expanded Facets */}
      {isExpanded && score?.facet && narrative?.facets && (
        <FacetList facets={score.facet} facetNarratives={narrative.facets} />
      )}
    </Stack>
  )
})
