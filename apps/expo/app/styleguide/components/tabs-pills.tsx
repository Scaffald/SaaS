import { Tabs, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function TabsPillsPage() {
  return (
    <StyleguidePage
      title="Tabs & Pills"
      description="Bootstrap pills rendered with Tamagui Tabs and theme overrides."
    >
      <YStack gap="$6">
        <AnchorHeading description="Use the 'pills' variant to round tab edges.">
          Pills
        </AnchorHeading>
        <ExampleBlock
          title="Pill tabs"
          code={`<Tabs defaultValue="design" orientation="horizontal" borderRadius="$5" backgroundColor="$gray2">\n  <Tabs.List gap="$2" padding="$2">\n    <Tabs.Tab value="design">Design</Tabs.Tab>\n    <Tabs.Tab value="code">Code</Tabs.Tab>\n    <Tabs.Tab value="accessibility">Accessibility</Tabs.Tab>\n  </Tabs.List>\n</Tabs>`}
        >
          <Tabs
            defaultValue="design"
            orientation="horizontal"
            borderRadius="$5"
            backgroundColor="$gray2"
          >
            <Tabs.List gap="$2" padding="$2">
              <Tabs.Tab value="design">Design</Tabs.Tab>
              <Tabs.Tab value="code">Code</Tabs.Tab>
              <Tabs.Tab value="accessibility">Accessibility</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
