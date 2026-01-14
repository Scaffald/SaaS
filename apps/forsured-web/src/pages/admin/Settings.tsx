// src/pages/admin/Settings.tsx
import React from 'react';
import { Settings } from 'lucide-react';
import { Stack, Row, Text, H1, H2, Card } from '@unicornlove/beyond-ui';

function AdminSettings() {
  return (
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>System Settings</H1>
      </Row>

      <Card style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-4)', textAlign: 'center', backgroundColor: 'var(--color-background)' }}>
        <Settings size={48} color="var(--color-10)" style={{ marginBottom: 'var(--space-4)' }} />
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-11)', marginBottom: 'var(--space-2)' }}>System Settings</H2>
        <Text style={{ color: 'var(--color-10)' }}>
          System settings are coming soon. This page will allow administrators to configure
          global application settings, integrations, and preferences.
        </Text>
      </Card>
    </Stack>
  );
}

export default AdminSettings;
