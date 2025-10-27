import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function GridUtilitiesPage() {
  return (
    <StyleguidePage
      title="Grid Utilities"
      description="Helper shorthands for responsive layout control."
    >
      <YStack gap="$6">
        <AnchorHeading description="Use Tamagui media props to change direction responsively.">
          Responsive stacks
        </AnchorHeading>
        <ExampleBlock
          title="Direction"
          code={`<XStack $xs={{ flexDirection: 'column' }} gap="$3">\n  <Text>Column on mobile</Text>\n  <Text>Row on desktop</Text>\n</XStack>`}
        >
          <XStack $xs={{ flexDirection: 'column' }} gap="$3">
            <Text>Column on mobile</Text>
            <Text>Row on desktop</Text>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
