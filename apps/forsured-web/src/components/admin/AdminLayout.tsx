/**
 * AdminLayout - Admin layout using Tamagui
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { XStack, YStack, Text, styled } from '@unicornlove/ui';

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

const NavItem = styled(XStack, {
  name: 'AdminNavItem',
  display: 'block',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$md',
  
  variants: {
    active: {
      true: {
        backgroundColor: '$blue9',
        color: '$color1',
      },
      false: {
        color: '$color11',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
      },
    },
  } as const,
});

function AdminLayout() {
  return (
    <XStack minHeight="100vh" backgroundColor="$backgroundHover">
      <YStack
        as="aside"
        width={256}
        backgroundColor="$backgroundHover"
        shadowColor="$shadowColor"
        shadowRadius={8}
        shadowOffset={{ width: 4, height: 0 }}
        padding="$4"
        gap="$6"
      >
        <Text fontSize="$6" fontWeight="600" marginBottom="$6">
          Admin Panel
        </Text>
        <YStack as="nav" gap="$2">
          {adminMenuItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <NavItem active={isActive}>
                  <Text>{item.label}</Text>
                </NavItem>
              )}
            </NavLink>
          ))}
        </YStack>
      </YStack>
      <YStack as="main" flex={1} padding="$6">
        <Outlet />
      </YStack>
    </XStack>
  );
}

export default AdminLayout;
