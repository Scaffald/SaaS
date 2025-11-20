// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { Sheet } from '@app/ui'
import { useState } from 'react'
import { Adapt, Select, Text, YStack } from 'tamagui'

const TEAMS = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'People Ops', value: 'people' },
]

export default function FormSelectsPage() {
  const [team, setTeam] = useState('engineering')

  return (
    <StyleguidePage
      title="Select menus"
      description="Tamagui Select paired with Adapt + Sheet for mobile fallbacks."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="selects-default"
          title="Default selects"
          description="Desktop uses an anchored menu while mobile slides up a bottom sheet."
        />
        <ExampleCard
          title="Team picker"
          description="Maps Bootstrap’s dropdown caret to Tamagui Select primitives."
          code={`<Select value={team} onValueChange={setTeam}>
  <Select.Trigger>
    <Select.Value placeholder="Choose team" />
  </Select.Trigger>
  <Adapt when="sm" platform="touch">
    <Sheet modal dismissOnSnapToBottom>
      <Sheet.Frame>
        <Sheet.ScrollView>
          <Select.Adapted />
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  </Adapt>
  <Select.Content>
    {TEAMS.map((item) => (
      <Select.Item key={item.value} value={item.value}>
        <Select.ItemText>{item.label}</Select.ItemText>
      </Select.Item>
    ))}
  </Select.Content>
</Select>`}
        >
          <Select value={team} onValueChange={setTeam} size="$4">
            <Select.Trigger>
              <Select.Value placeholder="Choose team" />
            </Select.Trigger>
            <Adapt when="sm" platform="touch">
              <Sheet modal dismissOnSnapToBottom animation="medium">
                <Sheet.Frame padding="$4">
                  <Sheet.ScrollView>
                    <Select.Adapted />
                  </Sheet.ScrollView>
                </Sheet.Frame>
              </Sheet>
            </Adapt>
            <Select.Content>
              {TEAMS.map((item) => (
                <Select.Item key={item.value} value={item.value}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Text fontSize={13} color="$color10">
            Selected: {team}
          </Text>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
