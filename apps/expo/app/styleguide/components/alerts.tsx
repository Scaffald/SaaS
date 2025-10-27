import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from '@tamagui/lucide-icons'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const alerts = [
  {
    title: 'Information',
    icon: Info,
    description: 'Use info alerts for contextual hints and onboarding states.',
    background: '$blue4',
  },
  {
    title: 'Success',
    icon: CheckCircle2,
    description: 'Confirm successful actions and highlight next steps.',
    background: '$green4',
  },
  {
    title: 'Warning',
    icon: AlertTriangle,
    description: 'Point to potential risks or validation issues.',
    background: '$yellow4',
  },
  {
    title: 'Danger',
    icon: OctagonAlert,
    description: 'Stop the user from continuing when critical errors occur.',
    background: '$red4',
  },
]

export default function AlertsPage() {
  return (
    <StyleguidePage
      title="Alerts"
      description="Contextual banners that mirror Bootstrap alerts, with accessible iconography."
    >
      <YStack gap="$6">
        <AnchorHeading description="Each alert uses a semantic background token and Tamagui icon.">
          Variants
        </AnchorHeading>
        <ExampleBlock
          title="Alert stack"
          code={`<YStack gap="$3">\n  {alerts.map((alert) => (\n    <XStack key={alert.title} backgroundColor={alert.background} padding="$4" borderRadius="$5" gap="$3">\n      <alert.icon size={20} />\n      <Paragraph>{alert.description}</Paragraph>\n    </XStack>\n  ))}\n</YStack>`}
        >
          <YStack gap="$3">
            {alerts.map((alert) => (
              <XStack
                key={alert.title}
                backgroundColor={alert.background}
                padding="$4"
                borderRadius="$5"
                gap="$3"
              >
                <alert.icon size={20} />
                <YStack gap="$1">
                  <Text fontWeight="700">{alert.title}</Text>
                  <Paragraph>{alert.description}</Paragraph>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
