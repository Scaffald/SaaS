import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function DashboardExamplePage() {
  return (
    <StyleguidePage
      title="Dashboard"
      description="A quick dashboard layout demonstrating grid, cards, and actions."
    >
      <YStack gap="$6">
        <AnchorHeading description="Combine grid utilities with card patterns.">
          Overview card
        </AnchorHeading>
        <ExampleBlock
          title="Dashboard"
          code={`<YStack gap="$4">\n  <XStack justifyContent="space-between" alignItems="center">\n    <Text fontSize={20} fontWeight="700">Team overview</Text>\n    <Button theme="primary">Invite</Button>\n  </XStack>\n  <XStack gap="$3" $xs={{ flexDirection: 'column' }}>\n    <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$4">\n      <Text fontWeight="700">Active projects</Text>\n      <Paragraph color="$gray11">12 ongoing</Paragraph>\n    </YStack>\n    <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$4">\n      <Text fontWeight="700">Hiring pipeline</Text>\n      <Paragraph color="$gray11">6 candidates</Paragraph>\n    </YStack>\n  </XStack>\n</YStack>`}
        >
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={20} fontWeight="700">
                Team overview
              </Text>
              <Button theme="primary">Invite</Button>
            </XStack>
            <XStack gap="$3" $xs={{ flexDirection: 'column' }}>
              <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$4">
                <Text fontWeight="700">Active projects</Text>
                <Paragraph color="$gray11">12 ongoing</Paragraph>
              </YStack>
              <YStack flex={1} borderWidth={1} borderColor="$gray4" borderRadius="$5" padding="$4">
                <Text fontWeight="700">Hiring pipeline</Text>
                <Paragraph color="$gray11">6 candidates</Paragraph>
              </YStack>
            </XStack>
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
