/**
 * HelpCenterLayout - Help center layout using Tamagui
 */
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { XStack, YStack, Text } from '@unicornlove/ui';

interface HelpCenterLayoutProps {
  userType: 'gc' | 'contractor' | 'broker' | 'admin';
}

function HelpCenterLayout({ userType }: HelpCenterLayoutProps) {
  const helpLinks = [
    { path: `/${userType}/help/getting-started`, label: 'Getting Started' },
    { path: `/${userType}/help/dashboard`, label: 'Dashboard Overview' },
    // Add more links based on userType specific documentation
  ];

  return (
    <XStack minHeight="100vh">
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
        <Text fontSize="$6" fontWeight="600">
          Help Center
        </Text>
        <YStack as="nav" gap="$2">
          {helpLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: isActive ? '$blue9' : 'transparent',
                color: isActive ? '$color1' : '$color11',
              })}
            >
              {link.label}
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

export default HelpCenterLayout;
