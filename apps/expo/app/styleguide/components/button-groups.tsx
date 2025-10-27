import { Button, XStack, YStack } from '@app/ui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function ButtonGroupsPage() {
  return (
    <StyleguidePage
      title="Button Groups"
      description="Compose segmented controls by wrapping Tamagui buttons in flex containers."
    >
      <YStack gap="$6">
        <AnchorHeading description="Group buttons without extra wrapper components by sharing radii.">
          Horizontal groups
        </AnchorHeading>
        <ExampleBlock
          title="Toolbar"
          code={`<XStack borderRadius="$5" overflow="hidden">\n  <Button theme="primary">Left</Button>\n  <Button theme="primary" borderRadius={0}>Middle</Button>\n  <Button theme="primary">Right</Button>\n</XStack>`}
        >
          <XStack borderRadius="$5" overflow="hidden">
            <Button theme="primary">Left</Button>
            <Button theme="primary" borderRadius={0}>
              Middle
            </Button>
            <Button theme="primary">Right</Button>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
