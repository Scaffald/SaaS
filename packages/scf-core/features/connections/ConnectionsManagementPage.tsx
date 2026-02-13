import { usePendingConnections } from '@scf/core/utils/engagement-sdk-hooks'
import { Tab, TabGroup } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import { Tabs, Text, Stack } from '@scaffald/ui'
import { ConnectionsList } from './components/ConnectionsList'
import { FollowersList } from './components/FollowersList'
import { FollowingList } from './components/FollowingList'
import { PendingRequestsList } from './components/PendingRequestsList'

type TabValue = 'connections' | 'followers' | 'following' | 'pending'

export function ConnectionsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('connections')

  // Fetch pending requests count for badge
  const { data: pendingData } = usePendingConnections()

  const pendingReceivedCount = useMemo(
    () => pendingData?.received.length || 0,
    [pendingData?.received.length]
  )

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text>Connections</Text>
        <Text color="$gray11">
          Manage your professional connections, followers, and pending requests.
        </Text>
      </Stack>

      <TabGroup value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <Tab value="connections" label="Connections" />
        <Tab value="followers" label="Followers" />
        <Tab value="following" label="Following" />
        <Tab
          value="pending"
          label="Pending Requests"
          badge={pendingReceivedCount > 0 ? pendingReceivedCount : undefined}
        />

        <Tabs.Content value="connections">
          <Stack paddingTop={16}>
            <ConnectionsList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="followers">
          <Stack paddingTop={16}>
            <FollowersList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="following">
          <Stack paddingTop={16}>
            <FollowingList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="pending">
          <Stack paddingTop={16}>
            <PendingRequestsList />
          </Stack>
        </Tabs.Content>
      </TabGroup>
    </Stack>
  )
}
