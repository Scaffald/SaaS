import { useState } from 'react'
import { Tabs, Text, Stack } from '@scaffald/ui'
import { AllCommunitiesList } from './components/AllCommunitiesList'
import { MyCommunitiesList } from './components/MyCommunitiesList'

type TabValue = 'all' | 'my'

export function CommunitiesHubPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all')

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text>Communities</Text>
        <Text color="$gray11">
          Join trade communities to share work, get feedback, and build your reputation.
        </Text>
      </Stack>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        type="line"
      >
        <Tabs.Item value="all">
          <Tabs.Trigger>All Communities</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <AllCommunitiesList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="my">
          <Tabs.Trigger>My Communities</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <MyCommunitiesList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </Stack>
  )
}
