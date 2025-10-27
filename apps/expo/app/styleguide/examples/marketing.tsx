import { Button, Paragraph, Text, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function MarketingExamplePage() {
  return (
    <StyleguidePage
      title="Marketing Page"
      description="Hero section and feature grid inspired by Bootstrap marketing layout."
    >
      <YStack gap="$6">
        <AnchorHeading description="Pair hero text with a clear primary CTA.">
          Hero
        </AnchorHeading>
        <ExampleBlock
          title="Hero"
          code={`<YStack gap="$4" alignItems="center" padding="$6" backgroundColor="$gray2" borderRadius="$6">\n  <Text fontSize={28} fontWeight="700">Build faster with Scaffald</Text>\n  <Paragraph color="$gray11" textAlign="center">Unified UI kit for product, hiring, and ops teams.</Paragraph>\n  <Button theme="primary">Request a demo</Button>\n</YStack>`}
        >
          <YStack gap="$4" alignItems="center" padding="$6" backgroundColor="$gray2" borderRadius="$6">
            <Text fontSize={28} fontWeight="700">
              Build faster with Scaffald
            </Text>
            <Paragraph color="$gray11" textAlign="center">
              Unified UI kit for product, hiring, and ops teams.
            </Paragraph>
            <Button theme="primary">Request a demo</Button>
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
