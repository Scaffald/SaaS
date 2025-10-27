import { ChevronDown } from '@tamagui/lucide-icons'
import { Adapt, Select, Sheet, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function SelectsPage() {
  return (
    <StyleguidePage
      title="Selects"
      description="Cross-platform select menu built from Tamagui’s Select primitive."
    >
      <YStack gap="$6">
        <AnchorHeading description="The select gracefully adapts into a sheet on touch devices.">
          Basic select
        </AnchorHeading>
        <ExampleBlock
          title="Select"
          code={`<Select defaultValue="one">\n  <Select.Trigger iconAfter={ChevronDown}>\n    <Select.Value placeholder="Select" />\n  </Select.Trigger>\n  <Adapt when="sm" platform="native">\n    <Sheet modal snapPoints={[50]}><Sheet.Frame><Sheet.ScrollView /></Sheet.Frame></Sheet>\n  </Adapt>\n  <Select.Content>...</Select.Content>\n</Select>`}
        >
          <Select defaultValue="one">
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select" />
            </Select.Trigger>
            <Adapt when="sm" platform="native">
              <Sheet modal snapPoints={[50]}>
                <Sheet.Frame>
                  <Sheet.ScrollView />
                </Sheet.Frame>
              </Sheet>
            </Adapt>
            <Select.Content>
              <Select.Item value="one" index={0}>
                <Select.ItemText>One</Select.ItemText>
              </Select.Item>
              <Select.Item value="two" index={1}>
                <Select.ItemText>Two</Select.ItemText>
              </Select.Item>
            </Select.Content>
          </Select>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
