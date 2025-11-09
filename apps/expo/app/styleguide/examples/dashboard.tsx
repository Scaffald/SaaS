// @ts-nocheck
import React from 'react'
import { Button, Paragraph, Text, XStack, YStack } from '@app/ui'
import { BarChart, type BarChartData } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'

const barData: BarChartData[] = [
  { value: 45, label: 'Mon', frontColor: '#4FC3F7' },
  { value: 60, label: 'Tue', frontColor: '#A8E6CF' },
  { value: 52, label: 'Wed', frontColor: '#FFD93D' },
  { value: 80, label: 'Thu', frontColor: '#FF6B6B' },
  { value: 65, label: 'Fri', frontColor: '#4ECDC4' },
]

export default function DashboardExamplePage() {
  return (
    <StyleguidePage
      title="Dashboard example"
      description="Composed page demonstrating cards, charts, tables, and buttons."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="dashboard-overview"
          title="Overview"
          description="Hero metrics with quick actions."
        />
        <YStack
          gap="$4"
          borderWidth={1}
          borderColor="$color6"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$color2"
        >
          <Text fontSize={18} fontWeight="600" color="$color11">
            Compliance health
          </Text>
          <Paragraph fontSize={13} color="$color10">
            Snapshot of company readiness for the upcoming audit cycle.
          </Paragraph>
          <XStack gap="$3" flexWrap="wrap">
            <Button>Generate report</Button>
            <Button backgroundColor="$color3" color="$color11">
              Schedule review
            </Button>
          </XStack>
        </YStack>
        <AnchorHeading
          id="dashboard-charts"
          title="Charts"
          description="Use @app/ui charts inside cards."
        />
        <YStack
          borderWidth={1}
          borderColor="$color6"
          borderRadius="$4"
          padding="$4"
          backgroundColor="$color1"
          gap="$3"
        >
          <Text fontSize={14} fontWeight="600" color="$color11">
            Training completion
          </Text>
          <BarChart data={barData} width={360} height={220} />
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
