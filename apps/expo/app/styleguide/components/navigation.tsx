// @ts-nocheck
import React, { useState } from 'react'
import { Button } from '@app/ui'
import { Tabs, Text, XStack, YStack } from 'tamagui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

const TAB_ITEMS = ['Overview', 'Activity', 'Settings']

export default function NavigationPage() {
  const [tab, setTab] = useState('Overview')

  return (
    <StyleguidePage
      title="Navigation"
      description="Tabs and pill navigation inspired by Bootstrap 2 nav components."
    >
      <YStack gap="$6">
        <AnchorHeading id="navigation-tabs" title="Tabs" description="Use Tamagui Tabs for horizontal navigation." />
        <ExampleCard
          title="Card tabs"
          description="Tabs with underline indicator and responsive stacking."
          code={`<Tabs value={tab} onValueChange={setTab}>
  <Tabs.List>
    {TAB_ITEMS.map((item) => (
      <Tabs.Tab key={item} value={item}>
        <Tabs.TabIndicator />
        {item}
      </Tabs.Tab>
    ))}
  </Tabs.List>
  <Tabs.Content value={tab}>...</Tabs.Content>
</Tabs>`}
        >
          <Tabs value={tab} onValueChange={setTab} size="$4" activationMode="manual">
            <Tabs.List
              borderWidth={1}
              borderColor="$color6"
              borderRadius="$4"
              backgroundColor="$color2"
              gap="$2"
            >
              {TAB_ITEMS.map((item) => (
                <Tabs.Tab key={item} value={item} borderRadius="$3" paddingVertical="$3">
                  <Tabs.TabIndicator />
                  <Text fontSize={13}>{item}</Text>
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {TAB_ITEMS.map((item) => (
              <Tabs.Content key={item} value={item} padding="$4">
                <Text fontSize={13} color="$color10">
                  {item} content goes here.
                </Text>
              </Tabs.Content>
            ))}
          </Tabs>
        </ExampleCard>
        <AnchorHeading id="navigation-pills" title="Pills" description="Use XStack with Button tokens for pill navigation." />
        <ExampleCard
          title="Pill nav"
          description="Bootstrap-style pill nav built with Buttons."
          code={`<XStack gap="$2">
  <Button borderRadius={999}>Active</Button>
  <Button borderRadius={999} backgroundColor="$color3">Link</Button>
</XStack>`}
        >
          <XStack gap="$2">
            <Button borderRadius={999} backgroundColor="$color9" color="$color1">
              Active
            </Button>
            <Button borderRadius={999} backgroundColor="$color3" color="$color11">
              Link
            </Button>
            <Button borderRadius={999} backgroundColor="$color3" color="$color11">
              Disabled
            </Button>
          </XStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
