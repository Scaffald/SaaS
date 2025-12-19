/**
 * BrokerDashboard - Broker dashboard page using Tamagui
 */
import React from 'react';
import { YStack, Text } from '@unicornlove/ui';
import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@unicornlove/ui';

function BrokerDashboard() {
  const handleInviteClient = () => {
    console.log('Navigate to invite client flow');
  };

  // Simulate no clients assigned
  const hasClients = false;

  return (
    <YStack gap="$6">
      <Text fontSize="$8" fontWeight="700" marginBottom="$6">
        Broker Dashboard
      </Text>
      {!hasClients ? (
        <EmptyState
          icon={<LayoutDashboard size={48} />}
          title="No Clients Assigned"
          description="Invite clients to manage their insurance needs and compliance."
          primaryAction={{ label: 'Invite Client', onClick: handleInviteClient }}
          helpLinks={[
            { label: 'How to Invite Clients', href: '#' },
          ]}
        />
      ) : (
        <YStack>Broker Dashboard Content</YStack>
      )}
    </YStack>
  );
}

export default BrokerDashboard;
