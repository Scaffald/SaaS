/**
 * NotFound Page - 404 page using Beyond UI
 */
import React from "react";
import { Link } from "react-router-dom";
import { Stack, Text, Button, H1 } from '@scaffald/ui';
import { colors, spacing, fontSize } from '@scaffald/ui';

const NotFound: React.FC = () => {
  return (
    <Stack
      style={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.light.hover,
      }}
    >
      <Stack style={{ alignItems: 'center', gap: spacing[16] }}>
        <H1
          style={{
            fontSize: fontSize.h1,
            fontWeight: 700,
            color: colors.text.light.primary,
          }}
        >
          404
        </H1>
        <Text
          style={{
            fontSize: fontSize.h6,
            color: colors.text.light.secondary,
            marginBottom: spacing[32],
          }}
        >
          Page not found
        </Text>
        <Button asChild variant="default">
          <Link to="/">Go Home</Link>
        </Button>
      </Stack>
    </Stack>
  );
};

export default NotFound;
