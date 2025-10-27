import { Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function ColorUtilitiesPage() {
  return (
    <StyleguidePage
      title="Color Utilities"
      description="Quick helpers for text and background color tokens."
    >
      <YStack gap="$6">
        <AnchorHeading description="Tokens map to Tamagui theme values.">
          Text colors
        </AnchorHeading>
        <ExampleBlock
          title="Text color"
          code={`<Text color="$blue10">Primary text</Text>`}
        >
          <Text color="$blue10">Primary text</Text>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
