// @ts-nocheck
import React from 'react'
import { Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

const BADGES = [
  { label: 'New', color: '$color9' },
  { label: 'Processing', color: '$color8' },
  { label: 'Approved', color: '$color10' },
  { label: 'Rejected', color: '$red10' },
]

export default function LabelsBadgesPage() {
  return (
    <StyleguidePage
      title="Labels & badges"
      description="Status chips used across tables, cards, and timelines."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="badges"
          title="Badges"
          description="Use YStack with borderRadius to mirror Bootstrap pill badges."
        />
        <ExampleCard
          title="Status chips"
          description="Mapping of semantic states to brand palette."
          code={`<XStack gap="$2">
  <YStack bg="$color9" borderRadius={999} paddingHorizontal="$3" paddingVertical="$1">
    <Text color="$color1">New</Text>
  </YStack>
</XStack>`}
        >
          <XStack gap="$2" flexWrap="wrap">
            {BADGES.map((badge) => (
              <YStack
                key={badge.label}
                bg={badge.color}
                borderRadius={999}
                paddingHorizontal="$3"
                paddingVertical="$1"
              >
                <Text fontSize={12} color="$color1">
                  {badge.label}
                </Text>
              </YStack>
            ))}
          </XStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
