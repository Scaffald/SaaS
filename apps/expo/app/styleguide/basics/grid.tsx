// @ts-nocheck
import React from 'react'
import { Paragraph, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

const columns = Array.from({ length: 12 }, (_, index) => index + 1)

export default function GridPage() {
  return (
    <StyleguidePage
      title="Grid & layout"
      description="Bootstrap-style 12 column layout constructed with Tamagui’s Stack primitives and responsive media queries."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="grid-fixed"
          title="Fixed grid"
          description="Use $containerWidth tokens to constrain content within a centered max-width wrapper."
        />
        <ExampleCard
          title="12-column preview"
          description="Each column uses flex-basis of 1/12 with responsive stacking under the xs media query."
          code={`<XStack gap="$2" flexWrap="wrap">
  {Array.from({ length: 12 }).map((_, index) => (
    <YStack key={index} width="8.33%" />
  ))}
</XStack>`}
        >
          <XStack gap="$2" flexWrap="wrap">
            {columns.map((column) => (
              <YStack
                key={column}
                width="8.33%"
                minWidth={88}
                bg="$color5"
                borderRadius="$3"
                padding="$2"
                alignItems="center"
                justify="center"
              >
                <Text fontSize={12} color="$color11">
                  {column}
                </Text>
              </YStack>
            ))}
          </XStack>
        </ExampleCard>
        <AnchorHeading
          id="grid-responsive"
          title="Responsive breakpoints"
          description="Media tokens defined in tamagui."
        />
        <Paragraph fontSize={13} color="$color10">
          Use props like <Text fontFamily="monospace">$md</Text> or{' '}
          <Text fontFamily="monospace">$sm</Text> to override flex directions at specific
          breakpoints. Example:{' '}
          <Text fontFamily="monospace">$sm={{ flexDirection: 'column' }}</Text> mirrors Bootstrap’s
          stacked columns on mobile.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
