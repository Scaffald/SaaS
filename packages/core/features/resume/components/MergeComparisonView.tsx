import { Fragment } from 'react'
import { Spinner, Text, XStack, YStack } from '@unicornlove/ui'

import type { ResumeMergeStrategy, ResumeWizardSection } from '../hooks/useResumeWizard'

interface MergeComparisonRow {
  id: ResumeWizardSection
  label: string
  strategy: ResumeMergeStrategy
  existingItems: string[]
  incomingItems: string[]
  hasIncoming: boolean
  notes?: string
}

interface MergeComparisonViewProps {
  sections: MergeComparisonRow[]
  isLoading?: boolean
}

const STRATEGY_LABELS: Record<ResumeMergeStrategy, string> = {
  replace: 'Replace existing data',
  append: 'Append to existing data',
  keepExisting: 'Keep existing data',
}

export function MergeComparisonView({ sections, isLoading = false }: MergeComparisonViewProps) {
  if (isLoading) {
    return (
      <XStack gap="$2" alignItems="center">
        <Spinner size="small" />
        <Text color="$color11">Loading current profile data…</Text>
      </XStack>
    )
  }

  if (sections.length === 0) {
    return (
      <YStack gap="$2">
        <Text fontWeight="600">Nothing to review</Text>
        <Text color="$color11">
          We didn’t detect any changes to compare. You can still finish the wizard to exit.
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$3">
      {sections.map((section) => (
        <YStack
          key={section.id}
          gap="$3"
          padding="$3"
          borderWidth={1}
          borderColor="$color6"
          backgroundColor="$color2"
          borderRadius="$4"
        >
          <XStack justifyContent="space-between" alignItems="center" gap="$2" flexWrap="wrap">
            <Text fontWeight="700" fontSize="$4">
              {section.label}
            </Text>
            <StrategyPill strategy={section.strategy} />
          </XStack>

          {section.notes ? (
            <Text color="$color11" fontSize="$2">
              {section.notes}
            </Text>
          ) : null}

          <XStack gap="$4" flexWrap="wrap">
            <SummaryColumn title="Current profile" alignItems={section.existingItems} />
            <SummaryColumn
              title="Incoming from resume"
              alignItems={section.incomingItems}
              highlight={section.hasIncoming}
            />
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

function SummaryColumn({
  title,
  items,
  highlight = false,
}: {
  title: string
  items: string[]
  highlight?: boolean
}) {
  return (
    <YStack
      gap="$2"
      flex={1}
      padding="$2"
      backgroundColor={highlight ? '$blue3' : 'transparent'}
      borderRadius="$3"
      style={{ minWidth: 220 }}
    >
      <Text fontWeight="600">{title}</Text>
      {items.length === 0 ? (
        <Text color="$color10">No data</Text>
      ) : (
        items.map((item, index) => (
          <Fragment key={`${title}-${index}-${item}`}>
            <Text color="$color11">{item}</Text>
          </Fragment>
        ))
      )}
    </YStack>
  )
}

function StrategyPill({ strategy }: { strategy: ResumeMergeStrategy }) {
  return (
    <YStack
      paddingHorizontal="$3"
      paddingVertical="$1"
      borderRadius="$3"
      backgroundColor={
        strategy === 'replace' ? '$red3' : strategy === 'append' ? '$blue3' : '$gray3'
      }
    >
      <Text
        fontSize="$2"
        fontWeight="600"
        color={strategy === 'replace' ? '$red11' : strategy === 'append' ? '$blue11' : '$color11'}
      >
        {STRATEGY_LABELS[strategy]}
      </Text>
    </YStack>
  )
}
