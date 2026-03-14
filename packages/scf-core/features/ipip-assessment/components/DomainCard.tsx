import type {
  IPIPDomain,
  IPIPResult,
  IPIPScore,
} from '@scf/core/features/personality-assessment/lib/ipip'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { memo, useState } from 'react'
import { Button, ProgressBar, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [isExpanded, setIsExpanded] = useState(false)

  const domainName = DOMAIN_NAMES[domain]
  const classification = score?.result || 'neutral'
  const percentage = normalizedScore || 0

  if (!isComplete) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor={colors.bg[t].muted}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[t].default}
        style={{ opacity: 0.6 }}
      >
        <Row justify="space-between" align="center">
          <Text color={colors.text[t].secondary}>{domainName}</Text>
          <Text color={colors.text[t].secondary}>Incomplete</Text>
        </Row>
        <Text color={colors.text[t].secondary}>
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
      backgroundColor={colors.bg[t].muted}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[t].default}
    >
      {/* Domain Header */}
      <Row justify="space-between" align="center">
        <Stack gap={4} flex={1}>
          <Text color={colors.text[t].secondary}>{domainName}</Text>
          <Text color={colors.text[t].secondary}>{narrative?.summary || ''}</Text>
        </Stack>
        <Stack align="flex-end" gap={4}>
          <Text
            color={
              classification === 'high'
                ? t === 'dark' ? colors.green[300] : colors.green[600]
                : classification === 'low'
                  ? t === 'dark' ? colors.blue[300] : colors.blue[600]
                  : colors.text[t].secondary
            }
          >
            {classification.toUpperCase()}
          </Text>
          <Text color={colors.text[t].secondary}>{Math.round(percentage)}%</Text>
        </Stack>
      </Row>

      {/* Progress Bar */}
      <ProgressBar value={percentage} />

      {/* Domain Result Text */}
      {domainResult && <Text color={colors.text[t].secondary}>{domainResult.text}</Text>}

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
