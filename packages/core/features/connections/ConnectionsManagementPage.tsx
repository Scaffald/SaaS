import { api } from '@app/core/utils/api'
import { Tab, TabGroup } from '@app/ui'
import { useMemo, useState } from 'react'
import { Spinner, Tabs, Text, YStack } from 'tamagui'
import { ConnectionsList } from './components/ConnectionsList'
import { FollowersList } from './components/FollowersList'
import { FollowingList } from './components/FollowingList'
import { PendingRequestsList } from './components/PendingRequestsList'

type TabValue = 'connections' | 'followers' | 'following' | 'pending'

export function ConnectionsManagementPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('connections')

  // Fetch pending requests count for badge
  const { data: pendingRequests } = api.connections.getPendingRequests.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const pendingReceivedCount = useMemo(
    () => pendingRequests?.received.length || 0,
    [pendingRequests?.received.length]
  )

  return (
    <YStack gap="$4">
      <YStack gap="$1">
        <Text fontSize="$7" fontWeight="700">
          Connections
        </Text>
        <Text color="$color11">
          Manage your professional connections, followers, and pending requests.
        </Text>
      </YStack>

      <TabGroup value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
        <Tab value="connections" label="Connections" />
        <Tab value="followers" label="Followers" />
        <Tab value="following" label="Following" />
        <Tab
          value="pending"
          label="Pending Requests"
          badge={pendingReceivedCount > 0 ? pendingReceivedCount : undefined}
        />

        <Tabs.Content value="connections" paddingTop="$4">
          <ConnectionsList />
        </Tabs.Content>
        <Tabs.Content value="followers" paddingTop="$4">
          <FollowersList />
        </Tabs.Content>
        <Tabs.Content value="following" paddingTop="$4">
          <FollowingList />
        </Tabs.Content>
        <Tabs.Content value="pending" paddingTop="$4">
          <PendingRequestsList />
        </Tabs.Content>
      </TabGroup>
    </YStack>
  )
}
