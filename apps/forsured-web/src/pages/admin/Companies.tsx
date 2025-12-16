// src/pages/admin/Companies.tsx
import React from 'react';
import { Building } from 'lucide-react';
import { YStack, XStack, Text, H1, H2, Card } from '@unicornlove/ui';

function AdminCompanies() {
  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <H1 fontSize="$8" fontWeight="bold">Company Management</H1>
      </XStack>

      <Card padding="$8" borderRadius="$4" elevation={1} textAlign="center" backgroundColor="$background">
        <Building size={48} color="$color10" marginBottom="$4" />
        <H2 fontSize="$6" fontWeight="600" color="$color11" marginBottom="$2">Company Management</H2>
        <Text color="$color10">
          Company management features are coming soon. This page will allow administrators to
          view, edit, and manage all registered companies in the system.
        </Text>
      </Card>
    </YStack>
  );
}

export default AdminCompanies;
