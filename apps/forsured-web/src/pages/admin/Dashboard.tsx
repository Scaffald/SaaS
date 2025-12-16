// src/pages/admin/Dashboard.tsx
import { YStack, XStack, Text, H1, H2, Card, styled } from '@unicornlove/ui';

const StatCard = styled(Card, {
  name: 'StatCard',
  backgroundColor: '$background',
  padding: '$6',
  borderRadius: '$4',
  elevation: 1,
});

const ActivityList = styled(YStack, {
  name: 'ActivityList',
  backgroundColor: '$background',
  padding: '$6',
  borderRadius: '$4',
  elevation: 1,
});

const ActivityItem = styled(XStack, {
  name: 'ActivityItem',
  paddingVertical: '$2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  variants: {
    last: {
      true: {
        borderBottomWidth: 0,
      },
    },
  },
});

function AdminDashboard() {
  return (
    <YStack>
      <H1 fontSize="$8" fontWeight="bold" marginBottom="$6">Admin Dashboard</H1>
      <XStack flexWrap="wrap" gap="$6">
        <StatCard
          width="100%"
          $gtMd={{ width: 'calc(50% - 12px)' }}
          $gtLg={{ width: 'calc(25% - 18px)' }}
        >
          <H2 fontSize="$5" fontWeight="600" marginBottom="$2">Total Users</H2>
          <Text fontSize="$9" fontWeight="bold">142</Text>
        </StatCard>
        <StatCard
          width="100%"
          $gtMd={{ width: 'calc(50% - 12px)' }}
          $gtLg={{ width: 'calc(25% - 18px)' }}
        >
          <H2 fontSize="$5" fontWeight="600" marginBottom="$2">Active Brokers</H2>
          <Text fontSize="$9" fontWeight="bold">23</Text>
        </StatCard>
        <StatCard
          width="100%"
          $gtMd={{ width: 'calc(50% - 12px)' }}
          $gtLg={{ width: 'calc(25% - 18px)' }}
        >
          <H2 fontSize="$5" fontWeight="600" marginBottom="$2">Projects</H2>
          <Text fontSize="$9" fontWeight="bold">89</Text>
        </StatCard>
        <StatCard
          width="100%"
          $gtMd={{ width: 'calc(50% - 12px)' }}
          $gtLg={{ width: 'calc(25% - 18px)' }}
        >
          <H2 fontSize="$5" fontWeight="600" marginBottom="$2">Tasks Created</H2>
          <Text fontSize="$9" fontWeight="bold">1,234</Text>
        </StatCard>
      </XStack>

      <YStack marginTop="$8">
        <H2 fontSize="$7" fontWeight="600" marginBottom="$4">Recent Activity</H2>
        <ActivityList>
          <ActivityItem>
            <Text>New GC signup: Acme Construction</Text>
          </ActivityItem>
          <ActivityItem>
            <Text>Broker invitation sent to jane@insurance.com</Text>
          </ActivityItem>
          <ActivityItem last>
            <Text>New project created: Downtown Tower</Text>
          </ActivityItem>
        </ActivityList>
      </YStack>
    </YStack>
  );
}

export default AdminDashboard;
