import { ArrowRight } from '@tamagui/lucide-icons'
import { Button, Paragraph, SizableText, Separator, YStack } from '@my/ui'
import type { ReactNode } from 'react'

import { DashboardCard, SectionHeading } from '../primitives'
import { OpportunityCard, type OpportunityItem } from './opportunity-card'

export type OpportunitySectionProps = {
  title: string
  subtitle?: string
  items: OpportunityItem[]
  headerAction?: ReactNode
  footerAction?: {
    label: string
    onPress?: () => void
  }
  emptyState?: {
    title: string
    description: string
    actionLabel?: string
    onActionPress?: () => void
  }
}

export const OpportunitySection = ({
  title,
  subtitle,
  items,
  headerAction,
  footerAction,
  emptyState,
}: OpportunitySectionProps) => {
  const hasItems = items.length > 0

  return (
    <DashboardCard gap="$4">
      <SectionHeading title={title} subtitle={subtitle} action={headerAction} />

      {hasItems ? (
        <YStack gap="$3">
          {items.map((item, index) => (
            <YStack key={item.id}>
              {index > 0 ? <Separator borderColor="$borderColor" /> : null}
              <OpportunityCard item={item} />
            </YStack>
          ))}
        </YStack>
      ) : emptyState ? (
        <EmptyState {...emptyState} />
      ) : null}

      {hasItems && footerAction ? (
        <Button
          chromeless
          size="$2"
          onPress={footerAction.onPress}
          iconAfter={ArrowRight}
          alignSelf="flex-start"
        >
          {footerAction.label}
        </Button>
      ) : null}
    </DashboardCard>
  )
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onActionPress,
}: NonNullable<OpportunitySectionProps['emptyState']>) => {
  return (
    <YStack gap="$2" py="$4">
      <SizableText size="$4" fontWeight="600">
        {title}
      </SizableText>
      <Paragraph size="$2" color="$gray11">
        {description}
      </Paragraph>
      {actionLabel ? (
        <Button size="$2" onPress={onActionPress} iconAfter={ArrowRight} alignSelf="flex-start">
          {actionLabel}
        </Button>
      ) : null}
    </YStack>
  )
}
