import { ArrowRight } from '@tamagui/lucide-icons'
import { Button, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import type { ReactNode } from 'react'

import { DashboardCard, SectionHeading } from '../primitives'

export type Insight = {
  id: string
  title: string
  description: string
  actionLabel?: string
  onActionPress?: () => void
}

export type CareerInsightCardProps = {
  insight: Insight
}

export const CareerInsightCard = ({ insight }: CareerInsightCardProps) => {
  return (
    <DashboardCard gap="$3">
      <YStack gap="$3">
        <SizableText size="$5" fontWeight="600">
          {insight.title}
        </SizableText>
        <Paragraph size="$2" color="$gray11">
          {insight.description}
        </Paragraph>
        {insight.actionLabel ? (
          <Button
            size="$2"
            variant="outlined"
            iconAfter={ArrowRight}
            alignSelf="flex-start"
            onPress={insight.onActionPress}
          >
            {insight.actionLabel}
          </Button>
        ) : null}
      </YStack>
    </DashboardCard>
  )
}

export type AfterProfileStep = {
  id: string
  title: string
  description: string
  icon?: ReactNode
}

export type AfterProfileSummaryCardProps = {
  steps: AfterProfileStep[]
}

export const AfterProfileSummaryCard = ({ steps }: AfterProfileSummaryCardProps) => {
  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="After filling out your profile"
        subtitle="Here is what happens once your profile is complete."
      />
      <YStack gap="$4">
        {steps.map((step) => (
          <XStack key={step.id} gap="$3" ai="flex-start">
            {step.icon ? <YStack mt="$1">{step.icon}</YStack> : null}
            <YStack gap="$1">
              <SizableText size="$4" fontWeight="600">
                {step.title}
              </SizableText>
              <Paragraph size="$2" color="$gray11">
                {step.description}
              </Paragraph>
            </YStack>
          </XStack>
        ))}
      </YStack>
    </DashboardCard>
  )
}
