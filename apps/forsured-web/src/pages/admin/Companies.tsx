// src/pages/admin/Companies.tsx
import React from 'react';
import { Building } from 'lucide-react';
import { Stack, Row, Text, H1, H2, Card } from '@scaffald/ui';

function AdminCompanies() {
  return (
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>Company Management</H1>
      </Row>

      <Card style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-4)', textAlign: 'center', backgroundColor: 'var(--color-background)' }}>
        <Building size={48} color="var(--color-10)" style={{ marginBottom: 'var(--space-4)' }} />
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-11)', marginBottom: 'var(--space-2)' }}>Company Management</H2>
        <Text style={{ color: 'var(--color-10)' }}>
          Company management features are coming soon. This page will allow administrators to
          view, edit, and manage all registered companies in the system.
        </Text>
      </Card>
    </Stack>
  );
}

export default AdminCompanies;
