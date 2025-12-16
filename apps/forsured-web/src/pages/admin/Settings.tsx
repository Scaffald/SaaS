// src/pages/admin/Settings.tsx
import React from 'react';
import { Settings } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, Card } from '@unicornlove/ui';

function AdminSettings() {
  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="bold">System Settings</H1>
      </XStack>

      <Card padding="$8" borderRadius="$4" elevation={1} textAlign="center" backgroundColor="$background">
        <Settings size={48} color="$color10" marginBottom="$4" />
        <H2 fontSize="$6" fontWeight="600" color="$color11" marginBottom="$2">System Settings</H2>
        <Text color="$color10">
          System settings are coming soon. This page will allow administrators to configure
          global application settings, integrations, and preferences.
        </Text>
      </Card>
    </YStack>
  );
}

export default AdminSettings;
