/**
 * Header - Application header component using Tamagui
 */
import React from 'react';
import { XStack, Button } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <XStack
      as="header"
      backgroundColor="$backgroundHover"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$6"
      paddingVertical="$4"
      shadowColor="$shadowColor"
      shadowRadius={4}
      shadowOffset={{ width: 0, height: 2 }}
      alignItems="center"
      justifyContent="space-between"
    >
      <XStack flex={1} />
      <CoreButton onClick={logout} variant="primary">
        Logout
      </CoreButton>
    </XStack>
  );
}
