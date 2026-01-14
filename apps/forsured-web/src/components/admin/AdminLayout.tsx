/**
 * AdminLayout - Admin layout using Beyond UI
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';

const adminMenuItems = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/brokers', label: 'Brokers' },
  { path: '/admin/user-set-types', label: 'Industry Verticals' },
  { path: '/admin/lexicon', label: 'Lexicon Editor' },
  { path: '/admin/enums', label: 'Enums' },
  { path: '/admin/audit-log', label: 'Audit Log' },
  { path: '/admin/settings', label: 'Settings' },
];

function getNavItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'block',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 8,
    backgroundColor: isActive ? 'var(--color-blue-9)' : 'transparent',
    color: isActive ? 'var(--color-1)' : 'var(--color-11)',
  };
}

function AdminLayout() {
  return (
    <Row style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-hover)' }}>
      <Stack
        as="aside"
        style={{
          width: 256,
          backgroundColor: 'var(--color-background-hover)',
          boxShadow: '4px 0 8px var(--color-shadow)',
          padding: 16,
          gap: 24,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
          Admin Panel
        </Text>
        <Stack as="nav" style={{ gap: 8 }}>
          {adminMenuItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <Row style={getNavItemStyle(isActive)}>
                  <Text>{item.label}</Text>
                </Row>
              )}
            </NavLink>
          ))}
        </Stack>
      </Stack>
      <Stack as="main" style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </Stack>
    </Row>
  );
}

export default AdminLayout;
