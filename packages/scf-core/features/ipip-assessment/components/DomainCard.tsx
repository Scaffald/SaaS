import type {
  IPIPDomain,
  IPIPResult,
  IPIPScore,
} from '@scf/core/features/personality-assessment/lib/ipip'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { memo, useState } from 'react'
import { Button, Progress, Text, Row, Stack } from '@scaffald/ui'
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
        gap={12}
        padding="md"
        backgroundColor="$color2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
        opacity={0.6}
      >
        <Row justify="space-between" align="center">
          <Text color="$gray11">{domainName}</Text>
          <Text color="$gray11">Incomplete</Text>
        </Row>
        <Text color="$gray11">
          Complete {domainName} questions to unlock your results for this domain.
        </Text>
      </Stack>
    )
  }

  const domainResult = narrative?.results?.[classification as 'low' | 'neutral' | 'high']

  return (
    <Stack
      gap={12}
      padding="md"
      backgroundColor="$color2"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      {/* Domain Header */}
      <Row justify="space-between" align="center">
        <Stack gap={4} flex={1}>
          <Text color="$gray11">{domainName}</Text>
          <Text color="$gray11">{narrative?.summary || ''}</Text>
        </Stack>
        <Stack align="flex-end" gap={4}>
          <Text
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
          <Text color="$gray11">{Math.round(percentage)}%</Text>
        </Stack>
      </Row>

      {/* Progress Bar */}
      <Progress value={percentage} max={100}>
        <Progress.Indicator animation="bouncy" />
      </Progress>

      {/* Domain Result Text */}
      {domainResult && <Text color="$gray11">{domainResult.text}</Text>}

      {/* Expand/Collapse Button */}
      {score?.facet && narrative?.facets && (
        <Button
          size="sm"
          variant="outline"
          onPress={() => setIsExpanded(!isExpanded)}
          iconStart={isExpanded ? ChevronUp : ChevronDown}
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
