import { usePendingConnections } from '@scf/core/utils/engagement-sdk-hooks'
import { useMemo, useState } from 'react'
import { Tabs, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ConnectionsList } from './components/ConnectionsList'
import { FollowersList } from './components/FollowersList'
import { FollowingList } from './components/FollowingList'
import { PendingRequestsList } from './components/PendingRequestsList'

type TabValue = 'connections' | 'followers' | 'following' | 'pending'

export function ConnectionsManagementPage() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
        <Text style={{ color: colors.text[t].secondary }}>
          Manage your professional connections, followers, and pending requests.
        </Text>
      </Stack>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} type="line">
        <Tabs.Item value="connections">
          <Tabs.Trigger>Connections</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <ConnectionsList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="followers">
          <Tabs.Trigger>Followers</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <FollowersList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="following">
          <Tabs.Trigger>Following</Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <FollowingList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="pending">
          <Tabs.Trigger>
            Pending Requests{pendingReceivedCount > 0 ? ` (${pendingReceivedCount})` : ''}
          </Tabs.Trigger>
          <Tabs.Content>
            <Stack paddingTop={16}>
              <PendingRequestsList />
            </Stack>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </Stack>
  )
}
