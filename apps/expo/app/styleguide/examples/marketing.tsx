// @ts-nocheck
import React from 'react'
import { Button, Paragraph, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'

export default function MarketingExamplePage() {
  return (
    <StyleguidePage
      title="Marketing landing"
      description="Hero, feature grid, and CTA sections inspired by Bootstrap marketing examples."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="marketing-hero"
          title="Hero"
          description="Full-width hero with gradient background and call to action."
        />
        <YStack
          borderRadius="$4"
          padding="$6"
          backgroundColor="$color3"
          gap="$4"
        >
          <Text fontSize={32} fontWeight="700" color="$color12">
            Compliance operations, simplified.
          </Text>
          <Paragraph fontSize={14} color="$color10">
            Orchestrate onboarding, certifications, and audits from a single workspace.
          </Paragraph>
          <XStack gap="$3">
            <Button>Request demo</Button>
            <Button backgroundColor="$color2" color="$color11">
              View pricing
            </Button>
          </XStack>
        </YStack>
        <AnchorHeading id="marketing-features" title="Feature grid" description="Three column grid using YStack." />
        <XStack gap="$3" flexWrap="wrap">
          {['Automated workflows', 'Real-time status', 'Audit-ready exports'].map((feature) => (
            <YStack key={feature} flex={1} minWidth={220} borderWidth={1} borderColor="$color6" borderRadius="$4" padding="$4" backgroundColor="$color1" gap={6}>
              <Text fontSize={16} fontWeight="600" color="$color11">
                {feature}
              </Text>
              <Paragraph fontSize={12} color="$color10">
                Detailed description of {feature.toLowerCase()} with examples.
              </Paragraph>
            </YStack>
          ))}
        </XStack>
      </YStack>
    </StyleguidePage>
  )
}
