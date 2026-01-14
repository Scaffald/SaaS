/**
 * SettingsLayout - Settings layout using Beyond UI
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Row, Stack, Text } from '@unicornlove/beyond-ui';
import { Settings } from 'lucide-react';
import SettingsNav from './SettingsNav';

interface SettingsLayoutProps {
  userType: 'gc' | 'contractor' | 'broker' | 'admin';
}

const userTypeLabels: Record<string, string> = {
  gc: 'General Contractor',
  contractor: 'Contractor',
  broker: 'Broker',
  admin: 'Admin',
};

function SettingsLayout({ userType }: SettingsLayoutProps) {
  return (
    <Row style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Settings Sidebar */}
      <aside
        style={{
          width: 256,
          backgroundColor: 'var(--color-backgroundHover)',
          borderRight: '1px solid var(--color-border)',
          padding: 24,
        }}
      >
        <Stack style={{ gap: 24 }}>
          <Row style={{ alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Settings size={24} color="currentColor" />
            <Stack>
              <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-color11)' }}>
                Settings
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color-color10)' }}>
                {userTypeLabels[userType]}
              </Text>
            </Stack>
          </Row>
          <SettingsNav userType={userType} />
        </Stack>
      </aside>

      {/* Settings Content */}
      <main style={{ flex: 1, padding: 24, backgroundColor: 'var(--color-background)' }}>
        <Outlet />
      </main>
    </Row>
  );
}

export default SettingsLayout;
