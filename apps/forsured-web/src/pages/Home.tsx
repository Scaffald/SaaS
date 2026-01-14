/**
 * Home Page - Landing page using Beyond UI
 */
import React from "react";
import { Stack, Text, H1 } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize } from '@unicornlove/beyond-ui';

const Home: React.FC = () => {
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
            marginBottom: spacing[16],
          }}
        >
          Welcome to ForSured
        </H1>
        <Text
          style={{
            fontSize: fontSize.h5,
            color: colors.text.light.secondary,
          }}
        >
          Modern insurance management for construction projects
        </Text>
      </Stack>
    </Stack>
  );
};

export default Home;
