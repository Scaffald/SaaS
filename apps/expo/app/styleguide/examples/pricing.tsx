// @ts-nocheck

import { AnchorHeading, StyleguidePage } from '@app/styleguide'
import { Button, Paragraph, Text, YStack } from '@app/ui'

const plans = [
  { name: 'Starter', price: '$49', features: ['Up to 25 users', 'Email support', '1 workflow'] },
  {
    name: 'Growth',
    price: '$99',
    features: ['Up to 100 users', 'Priority support', 'Unlimited workflows'],
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    features: ['Unlimited users', 'Dedicated CSM', 'Custom SLAs'],
  },
]

export default function PricingExamplePage() {
  return (
    <StyleguidePage
      title="Pricing"
      description="Three-column pricing table using Bootstrap-like cards."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="pricing-grid"
          title="Plans"
          description="Responsive stack of pricing cards."
        />
        <YStack gap="$3" flexWrap="wrap" flexDirection="row">
          {plans.map((plan) => (
            <YStack
              key={plan.name}
              flex={1}
              minWidth={240}
              borderWidth={1}
              borderColor="$color6"
              borderRadius="$4"
              padding="$4"
              bg="$color1"
              gap="$3"
            >
              <Text fontSize={16} fontWeight="600" color="$color11">
                {plan.name}
              </Text>
              <Text fontSize={24} fontWeight="700" color="$color11">
                {plan.price}
              </Text>
              <YStack gap={4}>
                {plan.features.map((feature) => (
                  <Paragraph key={feature} fontSize={12} color="$color10">
                    • {feature}
                  </Paragraph>
                ))}
              </YStack>
              <Button>Choose plan</Button>
            </YStack>
          ))}
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
