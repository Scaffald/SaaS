import { Tabs, YStack } from 'tamagui'
import { AnchorHeading, ExampleBlock, StyleguidePage } from '../_components'

export default function NavigationPage() {
  return (
    <StyleguidePage
      title="Navigation"
      description="Tabs and pill navigations styled like Bootstrap navs while relying on Tamagui Tabs."
    >
      <YStack gap="$6">
        <AnchorHeading description="Tabs have keyboard focus trapping and arrow key support.">
          Tabs
        </AnchorHeading>
        <ExampleBlock
          title="Segmented tabs"
          code={`<Tabs defaultValue="overview">\n  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="reports">Reports</Tabs.Tab>
    <Tabs.Tab value="team">Team</Tabs.Tab>
  </Tabs.List>
</Tabs>`}
        >
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="reports">Reports</Tabs.Tab>
              <Tabs.Tab value="team">Team</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </ExampleBlock>
      </YStack>
    </StyleguidePage>
  )
}
