// src/pages/broker/settings/ClientSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2 } from '@unicornlove/ui';
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

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

  if (isLoading) {
    return (
      <YStack gap="$4">
        <H2>Client Management Settings</H2>
        <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Client Management Settings</H2>
      <Text color="$color10" marginBottom="$6">
        Configure how new clients are assigned to you.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Checkbox
            checked={autoAssignClients}
            onChange={(e) => setAutoAssignClients(e.target.checked)}
            label="Automatically assign new clients to me"
            helperText="When enabled, new clients in your agency's territory will automatically be assigned to you."
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            marginTop="$6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default BrokerClientSettings;
