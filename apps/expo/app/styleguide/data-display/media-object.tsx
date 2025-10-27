import { Avatar, Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function MediaObjectPage() {
  return (
    <StyleguidePage
      title="Media Object"
      description="Bootstrap’s media object recreated with Tamagui stacks."
    >
      <YStack gap="$6">
        <AnchorHeading description="Align avatar with content using XStack.">
          Media block
        </AnchorHeading>
        <ExampleBlock
          title="Comment"
          code={`<XStack gap="$3" alignItems="flex-start">\n  <Avatar circular size="$4"><Avatar.Image src="https://i.pravatar.cc/64" /></Avatar>\n  <YStack gap="$1">\n    <Text fontWeight="700">Olivia</Text>\n    <Paragraph color="$gray11">Posted a new update.</Paragraph>\n  </YStack>\n</XStack>`}
        >
          <XStack gap="$3" alignItems="flex-start">
            <Avatar circular size="$4">
              <Avatar.Image src="https://i.pravatar.cc/64" />
            </Avatar>
            <YStack gap="$1">
              <Text fontWeight="700">Olivia</Text>
              <Paragraph color="$gray11">Posted a new update.</Paragraph>
            </YStack>
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
