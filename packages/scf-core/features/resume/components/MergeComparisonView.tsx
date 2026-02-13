import { Fragment } from 'react'
import { Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Row gap={8} align="center">
        <Spinner size="sm" />
        <Text color="gray">Loading current profile data…</Text>
      </Row>
    )
  }

  if (sections.length === 0) {
    return (
      <Stack gap={8}>
        <Text>Nothing to review</Text>
        <Text color="gray">
          We didn’t detect any changes to compare. You can still finish the wizard to exit.
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={12}>
      {sections.map((section) => (
        <Stack
          key={section.id}
          gap={12}
          padding={12}
          borderWidth={1}
          borderColor="$color6"
          backgroundColor="$color2"
          borderRadius={16}
        >
          <Row justify="space-between" align="center" gap={8} flexWrap="wrap">
            <Text>
              {section.label}
            </Text>
            <StrategyPill strategy={section.strategy} />
          </Row>

          {section.notes ? (
            <Text color="gray">
              {section.notes}
            </Text>
          ) : null}

          <Row gap={16} flexWrap="wrap">
            <SummaryColumn title="Current profile" align={section.existingItems} />
            <SummaryColumn
              title="Incoming from resume"
              align={section.incomingItems}
              highlight={section.hasIncoming}
            />
          </Row>
        </Stack>
      ))}
    </Stack>
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
    <Stack
      gap={8}
      flex={1}
      padding={8}
      backgroundColor={highlight ? '$blue3' : 'transparent'}
      borderRadius={12}
      style={{ minWidth: 220 }}
    >
      <Text>{title}</Text>
      {items.length === 0 ? (
        <Text color="gray">No data</Text>
      ) : (
        items.map((item, index) => (
          <Fragment key={`${title}-${index}-${item}`}>
            <Text color="gray">{item}</Text>
          </Fragment>
        ))
      )}
    </Stack>
  )
}

function StrategyPill({ strategy }: { strategy: ResumeMergeStrategy }) {
  return (
    <Stack
      paddingHorizontal={12}
      paddingVertical={4}
      borderRadius={12}
      backgroundColor={
        strategy === 'replace' ? '$red3' : strategy === 'append' ? '$blue3' : '$gray3'
      }
    >
      <Text
        color={strategy === 'replace' ? '$red11' : strategy === 'append' ? '$blue11' : '$color11'}
      >
        {STRATEGY_LABELS[strategy]}
      </Text>
    </Stack>
  )
}
