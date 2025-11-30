import { api } from '@app/core/utils/api'
import { Tab, TabGroup } from '@scaffald/neue-ui'
import { useMemo, useState } from 'react'
import { Tabs, Text, YStack } from 'tamagui'
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

        <Tabs.Content value="connections">
          <YStack pt="$4">
            <ConnectionsList />
          </YStack>
        </Tabs.Content>
        <Tabs.Content value="followers">
          <YStack pt="$4">
            <FollowersList />
          </YStack>
        </Tabs.Content>
        <Tabs.Content value="following">
          <YStack pt="$4">
            <FollowingList />
          </YStack>
        </Tabs.Content>
        <Tabs.Content value="pending">
          <YStack pt="$4">
            <PendingRequestsList />
          </YStack>
        </Tabs.Content>
      </TabGroup>
    </YStack>
  )
}
