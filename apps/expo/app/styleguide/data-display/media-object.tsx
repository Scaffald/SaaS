// @ts-nocheck
import React from 'react'
import { Paragraph, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

export default function MediaObjectPage() {
  return (
    <StyleguidePage
      title="Media object"
      description="Classic Bootstrap media object built with Tamagui primitives."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="media-object"
          title="Media object"
          description="Align avatar and content with flexible widths."
        />
        <ExampleCard
          title="Media card"
          description="Left-aligned avatar with stacked metadata."
          code={`<XStack gap="$3" alignItems="flex-start">
  <YStack width={64} height={64} borderRadius={12} backgroundColor="$color4" />
  <YStack>
    <Text fontWeight="600">Quarterly compliance</Text>
    <Paragraph>Our Q1 focus areas and staffing plan.</Paragraph>
  </YStack>
</XStack>`}
        >
          <XStack gap="$3" alignItems="flex-start" borderWidth={1} borderColor="$color6" borderRadius="$4" padding="$3">
            <YStack width={64} height={64} borderRadius={12} backgroundColor="$color4" />
            <YStack gap={6} flex={1}>
              <Text fontSize={14} fontWeight="600" color="$color11">
                Quarterly compliance update
              </Text>
              <Paragraph fontSize={12} color="$color10">
                Review coverage, gaps, and certification renewals for the upcoming quarter.
              </Paragraph>
            </YStack>
          </XStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
