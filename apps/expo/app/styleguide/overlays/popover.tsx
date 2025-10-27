import { Popover, Button, Paragraph, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function PopoverPage() {
  return (
    <StyleguidePage
      title="Popover"
      description="Popover surfaces using Tamagui Popover with focus management."
    >
      <YStack gap="$6">
        <AnchorHeading description="Popover content traps focus until dismissed.">
          Popover
        </AnchorHeading>
        <ExampleBlock
          title="Popover"
          code={`<Popover>\n  <Popover.Trigger asChild><Button>Open</Button></Popover.Trigger>\n  <Popover.Content><Paragraph>More context</Paragraph></Popover.Content>\n</Popover>`}
        >
          <Popover>
            <Popover.Trigger asChild>
              <Button>Open</Button>
            </Popover.Trigger>
            <Popover.Content borderRadius="$5" padding="$4" backgroundColor="$color" borderWidth={1} borderColor="$gray5">
              <Paragraph>More context for the selected element.</Paragraph>
            </Popover.Content>
          </Popover>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
