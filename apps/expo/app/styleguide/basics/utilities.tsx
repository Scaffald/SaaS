// @ts-nocheck
import React from 'react'
import { Paragraph, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'

const utilities = [
  {
    name: 'Padding',
    usage: "px='$4' py='$5'",
    description: 'Maps to spacing tokens for consistent gutters.',
  },
  {
    name: 'Display',
    usage: "$sm={{ display: 'none' }}",
    description: 'Hide blocks at mobile breakpoints similar to Bootstrap’s hidden-* classes.',
  },
  {
    name: 'Text alignment',
    usage: "textAlign='center' $gtSm={{ textAlign: 'left' }}",
    description: 'Responsive text alignment.',
  },
  {
    name: 'Color',
    usage: "color='$color11'",
    description: 'Semantic text colors referencing Tamagui tokens.',
  },
]

export default function UtilitiesPage() {
  return (
    <StyleguidePage
      title="Utility helpers"
      description="Token-driven props that replace Bootstrap utility classes."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="utilities-overview"
          title="Common utilities"
          description="Examples of Tamagui prop-based utilities replacing class names."
        />
        <YStack gap="$3">
          {utilities.map((utility) => (
            <YStack
              key={utility.name}
              borderWidth={1}
              borderColor="$color6"
              borderRadius="$4"
              padding="$4"
              bg="$color2"
              gap={6}
            >
              <Text fontSize={14} fontWeight="600" color="$color11">
                {utility.name}
              </Text>
              <Text fontSize={12} fontFamily="monospace" color="$color9">
                {utility.usage}
              </Text>
              <Paragraph fontSize={12} color="$color10">
                {utility.description}
              </Paragraph>
            </YStack>
          ))}
        </YStack>
        <AnchorHeading
          id="utilities-spacing"
          title="Spacing scale"
          description="Spacing tokens from $1-$10 correspond to Tamagui’s baseline grid."
        />
        <XStack gap="$2" flexWrap="wrap">
          {Array.from({ length: 8 }, (_, index) => index + 1).map((token) => (
            <YStack key={token} alignItems="center" gap={4}>
              <YStack width={48} height={token * 4} bg="$color5" borderRadius="$2" />
              <Text fontSize={12} color="$color10">
                {'$'}
                {token}
              </Text>
            </YStack>
          ))}
        </XStack>
      </YStack>
    </StyleguidePage>
  )
}
