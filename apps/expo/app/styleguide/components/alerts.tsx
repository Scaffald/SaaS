// @ts-nocheck
import React from 'react'
import { Paragraph, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

const ALERTS = [
  { label: 'Primary', color: '$color9', message: 'Heads up! Read this important alert message.' },
  { label: 'Success', color: '$color10', message: 'Your documents were submitted successfully.' },
  { label: 'Warning', color: '$color8', message: 'Your certification expires in 3 days.' },
  { label: 'Danger', color: '$red10', message: 'We could not verify your identity. Retry now.' },
]

export default function AlertsPage() {
  return (
    <StyleguidePage title="Alerts" description="Bootstrap-style contextual feedback messages.">
      <YStack gap="$6">
        <AnchorHeading
          id="alerts-basic"
          title="Alert variants"
          description="Background color plus bold heading and supporting text."
        />
        <ExampleCard
          title="Contextual alerts"
          description="Each variant uses contrasting text and shadow for emphasis."
          code={`<YStack gap="$3">{ALERTS.map((alert) => <AlertCard key={alert.label} {...alert} />)}</YStack>`}
        >
          <YStack gap="$3">
            {ALERTS.map((alert) => (
              <AlertCard key={alert.label} {...alert} />
            ))}
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}

type AlertCardProps = {
  label: string
  color: string
  message: string
}

const AlertCard = ({ label, color, message }: AlertCardProps) => (
  <YStack
    borderRadius="$4"
    borderWidth={1}
    borderColor="$color6"
    backgroundColor="$color1"
    shadowColor="rgba(0,0,0,0.05)"
    shadowRadius={12}
    padding="$4"
    gap={8}
  >
    <XStack gap="$3" alignItems="center">
      <YStack width={8} height={8} borderRadius={999} backgroundColor={color} />
      <Text fontSize={14} fontWeight="600" color="$color11">
        {label}
      </Text>
    </XStack>
    <Paragraph fontSize={13} color="$color10">
      {message}
    </Paragraph>
  </YStack>
)
