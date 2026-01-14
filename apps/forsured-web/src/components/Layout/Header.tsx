/**
 * Header - Application header component using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import React from 'react';
import { Row, Button } from '@unicornlove/beyond-ui';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <Row
      as="header"
      alignItems="center"
      justifyContent="space-between"
      style={{
        backgroundColor: 'var(--color-background-hover)',
        borderBottom: '1px solid var(--color-border)',
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        boxShadow: '0 2px 4px var(--color-shadow)',
      }}
    >
      <Row flex={1} />
      <Button onPress={logout} variant="primary">
        Logout
      </Button>
    </Row>
  );
}
