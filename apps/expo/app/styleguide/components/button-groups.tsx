// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { Button, Text, XStack, YStack } from '@app/ui'
import { useState } from 'react'

export default function ButtonGroupsPage() {
  const [active, setActive] = useState('day')

  return (
    <StyleguidePage
      title="Button groups"
      description="Segmented controls using Tamagui stacks for horizontal and vertical groupings."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="button-groups-horizontal"
          title="Horizontal"
          description="Wrap Buttons in an XStack with shared borders for Bootstrap’s .btn-group."
        />
        <ExampleCard
          title="Time range switcher"
          description="Segmented control toggles between presets."
          code={`<XStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
  {['day','week','month'].map((option) => (
    <Button key={option} bg={active === option ? '$color9' : '$color2'}>
      {option}
    </Button>
  ))}
</XStack>`}
        >
          <XStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
            {['day', 'week', 'month'].map((option) => (
              <Button
                key={option}
                bg={active === option ? '$color9' : '$color2'}
                color={active === option ? '$color1' : '$color11'}
                borderRadius={0}
                onPress={() => setActive(option)}
              >
                <Text textTransform="capitalize">{option}</Text>
              </Button>
            ))}
          </XStack>
        </ExampleCard>
        <AnchorHeading
          id="button-groups-vertical"
          title="Vertical"
          description="Use YStack for stacked actions."
        />
        <ExampleCard
          title="Bulk actions"
          description="Stacked buttons for list selections."
          code={`<YStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
  <Button borderRadius={0}>Archive</Button>
  <Button borderRadius={0}>Duplicate</Button>
  <Button borderRadius={0}>Delete</Button>
</YStack>`}
        >
          <YStack borderWidth={1} borderColor="$color6" borderRadius="$4" overflow="hidden">
            <Button borderRadius={0}>Archive</Button>
            <Button borderRadius={0}>Duplicate</Button>
            <Button borderRadius={0} bg="$color8" color="$color1">
              Delete
            </Button>
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
