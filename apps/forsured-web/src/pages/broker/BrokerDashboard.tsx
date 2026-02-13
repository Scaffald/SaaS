/**
 * BrokerDashboard - Broker dashboard page using Beyond UI
 */
import React from 'react';
import { Stack, Text } from '@scaffald/ui';
import { EmptyState } from '../../ui/EmptyState';
import { LayoutDashboard } from 'lucide-react';
import PageTransition from '../../components/Common/PageTransition';

function BrokerDashboard() {
  const handleInviteClient = () => {
    console.log('Navigate to invite client flow');
  };

  // Simulate no clients assigned
  const hasClients = false;

  return (
    <PageTransition>
      <Stack style={{ gap: 'var(--space-6)' }}>
        <Text
          size="2xl"
          weight="bold"
          style={{ marginBottom: 'var(--space-6)' }}
        >
          Broker Dashboard
        </Text>
        {!hasClients ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No Clients Assigned"
            description="Invite clients to manage their insurance needs and compliance."
            action={{ label: 'Invite Client', onClick: handleInviteClient }}
          />
        ) : (
          <Stack>Broker Dashboard Content</Stack>
        )}
      </Stack>
    </PageTransition>
  );
}

export default BrokerDashboard;
