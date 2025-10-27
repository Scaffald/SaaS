import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function SpacingUtilitiesPage() {
  return (
    <StyleguidePage
      title="Spacing Utilities"
      description="Token-driven spacing helpers available on every Tamagui primitive."
    >
      <YStack gap="$6">
        <AnchorHeading description="Use padding/margin props with token values.">
          Padding
        </AnchorHeading>
        <ExampleBlock
          title="Padding"
          code={`<YStack padding="$4" backgroundColor="$gray3">Padding $4</YStack>`}
        >
          <YStack padding="$4" backgroundColor="$gray3" borderRadius="$3">
            <Text>Padding $4</Text>
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
