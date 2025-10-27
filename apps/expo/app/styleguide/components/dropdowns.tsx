import { ChevronDown } from '@tamagui/lucide-icons'
import { Adapt, Select, Sheet, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
]

export default function DropdownsPage() {
  return (
    <StyleguidePage
      title="Dropdowns"
      description="Use Tamagui Select for cross-platform dropdowns with Bootstrap-inspired styling."
    >
      <YStack gap="$6">
        <AnchorHeading description="Select adapts to sheet presentation on mobile via Adapt/Sheet.">
          Select menu
        </AnchorHeading>
        <ExampleBlock
          title="Contextual dropdown"
          code={`<Select value={value} onValueChange={setValue}>\n  <Select.Trigger iconAfter={ChevronDown}>\n    <Select.Value placeholder="Choose" />\n  </Select.Trigger>\n  <Adapt when="sm" platform="native">\n    <Sheet modal snapPoints={[50]}><Sheet.Frame><Sheet.ScrollView /></Sheet.Frame></Sheet>\n  </Adapt>\n  <Select.Content>...items...</Select.Content>\n</Select>`}
        >
          <Select defaultValue="overview">
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Choose" />
            </Select.Trigger>
            <Adapt when="sm" platform="native">
              <Sheet modal snapPoints={[50]}>
                <Sheet.Frame>
                  <Sheet.ScrollView />
                </Sheet.Frame>
              </Sheet>
            </Adapt>
            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport>
                {items.map((item, index) => (
                  <Select.Item key={item.value} index={index} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
