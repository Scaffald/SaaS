import { Button, Input, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function InputGroupsPage() {
  return (
    <StyleguidePage
      title="Input Groups"
      description="Compose inputs with prepend/append controls like Bootstrap input groups."
    >
      <YStack gap="$6">
        <AnchorHeading description="Wrap controls in XStack with shared border radius.">
          Input with button
        </AnchorHeading>
        <ExampleBlock
          title="Search"
          code={`<XStack borderRadius="$5" overflow="hidden" borderWidth={1} borderColor="$gray5">\n  <Input flex={1} placeholder="Search" borderWidth={0} />\n  <Button theme="primary">Go</Button>\n</XStack>`}
        >
          <XStack borderRadius="$5" overflow="hidden" borderWidth={1} borderColor="$gray5">
            <Input flex={1} placeholder="Search" borderWidth={0} />
            <Button theme="primary">Go</Button>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
