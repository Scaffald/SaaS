// src/pages/broker/settings/ClientSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2 } from '@unicornlove/beyond-ui';
import Checkbox from '../../../ui/Checkbox';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function BrokerClientSettings() {
  const { brokerSettings, updateBrokerSettings, isLoading, isSaving } = useSettings();

  const [autoAssignClients, setAutoAssignClients] = useState(false);
  const [originalAutoAssign, setOriginalAutoAssign] = useState(false);

  // Initialize from brokerSettings
  useEffect(() => {
    if (brokerSettings) {
      const autoAssign = brokerSettings.auto_assign_clients ?? false;
      setAutoAssignClients(autoAssign);
      setOriginalAutoAssign(autoAssign);
    }
  }, [brokerSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return autoAssignClients !== originalAutoAssign;
  }, [autoAssignClients, originalAutoAssign]);

  const handleSubmit = useCallback(async () => {
    try {
      await updateBrokerSettings({
        auto_assign_clients: autoAssignClients,
      });
      setOriginalAutoAssign(autoAssignClients);
      toast.success('Client settings saved successfully');
    } catch (err) {
      console.error('Failed to save client settings:', err);
      toast.error('Failed to save client settings');
    }
  }, [autoAssignClients, updateBrokerSettings]);

  const skeletonStyle: React.CSSProperties = {
    height: 40,
    backgroundColor: 'var(--color-3)',
    borderRadius: 'var(--radius-4)',
  };

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Client Management Settings</H2>
        <div style={skeletonStyle} />
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Client Management Settings</H2>
      <Text muted style={{ marginBottom: 'var(--space-6)' }}>
        Configure how new clients are assigned to you.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Checkbox
            checked={autoAssignClients}
            onChange={(e) => setAutoAssignClients(e.target.checked)}
            label="Automatically assign new clients to me"
            helperText="When enabled, new clients in your agency's territory will automatically be assigned to you."
          />
          <Button
            onPress={handleSubmit}
            disabled={!isDirty || isSaving}
            loading={isSaving}
            color="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            Save Changes
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default BrokerClientSettings;
