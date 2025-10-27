import { Paragraph, Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <YStack borderWidth={1} borderColor="$gray5" borderRadius="$5" overflow="hidden" width="100%">
      <YStack height={12} width={`${value}%`} backgroundColor={color} />
    </YStack>
  )
}

export default function ProgressPage() {
  return (
    <StyleguidePage
      title="Progress"
      description="Progress bars and meters styled with Tamagui stacks."
    >
      <YStack gap="$6">
        <AnchorHeading description="Simple progress bars use width percentages.">
          Bars
        </AnchorHeading>
        <ExampleBlock
          title="Progress"
          code={`<ProgressBar value={60} color="$blue9" />`}
        >
          <YStack gap="$3">
            <Paragraph>60% complete</Paragraph>
            <ProgressBar value={60} color="$blue9" />
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
