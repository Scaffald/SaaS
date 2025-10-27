import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const plans = [
  { title: 'Starter', price: '$0', description: 'For small teams evaluating Scaffald.' },
  { title: 'Growth', price: '$39', description: 'For scaling companies needing collaboration.' },
]

export default function PricingExamplePage() {
  return (
    <StyleguidePage
      title="Pricing"
      description="Bootstrap-style pricing table built with cards."
    >
      <YStack gap="$6">
        <AnchorHeading description="Two-column pricing layout with responsive stack.">
          Plans
        </AnchorHeading>
        <ExampleBlock
          title="Pricing"
          code={`<XStack gap="$3" $xs={{ flexDirection: 'column' }}>\n  {plans.map((plan) => (\n    <YStack key={plan.title} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$5" gap="$3">\n      <Text fontWeight="700">{plan.title}</Text>\n      <Text fontSize={32}>{plan.price}</Text>\n      <Paragraph color="$gray11">{plan.description}</Paragraph>\n      <Button theme="primary">Choose plan</Button>\n    </YStack>\n  ))}\n</XStack>`}
        >
          <XStack gap="$3" $xs={{ flexDirection: 'column' }}>
            {plans.map((plan) => (
              <YStack
                key={plan.title}
                borderWidth={1}
                borderColor="$gray4"
                borderRadius="$5"
                padding="$5"
                gap="$3"
              >
                <Text fontWeight="700">{plan.title}</Text>
                <Text fontSize={32}>{plan.price}</Text>
                <Paragraph color="$gray11">{plan.description}</Paragraph>
                <Button theme="primary">Choose plan</Button>
              </YStack>
            ))}
          </XStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
