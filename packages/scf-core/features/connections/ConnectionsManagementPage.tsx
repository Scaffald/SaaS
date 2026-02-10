import { usePendingConnections } from '@scf/core/utils/engagement-sdk-hooks'
import { Tab, TabGroup } from '@unicornlove/beyond-ui'
import { useMemo, useState } from 'react'
import { Tabs, Text, Stack } from '@unicornlove/beyond-ui'
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
    <Stack gap="$4">
      <Stack gap="$1">
        <Text fontSize="$7" fontWeight="700">
          Connections
        </Text>
        <Text color="$color11">
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
          <Stack paddingTop="$4">
            <ConnectionsList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="followers">
          <Stack paddingTop="$4">
            <FollowersList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="following">
          <Stack paddingTop="$4">
            <FollowingList />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="pending">
          <Stack paddingTop="$4">
            <PendingRequestsList />
          </Stack>
        </Tabs.Content>
      </TabGroup>
    </Stack>
  )
}
