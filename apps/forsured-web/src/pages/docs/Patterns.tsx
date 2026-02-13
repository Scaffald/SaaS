// src/pages/docs/Patterns.tsx
import React from 'react';
import { Stack, Row, Box, Text, H1, H2, H3 } from '@scaffald/ui';
import { colors, spacing, fontSize, borderRadius } from '@scaffald/ui';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

function PatternsDoc() {
  return (
    <Box style={{ padding: spacing[24] }}>
      <H1 style={{ fontSize: fontSize.h3, fontWeight: 'bold', marginBottom: spacing[16], color: colors.text.light.primary }}>UI Patterns</H1>
      <Text style={{ fontSize: fontSize.h5, color: colors.text.light.secondary, marginBottom: spacing[24] }}>
        UI patterns are reusable solutions to common design problems. They provide a standardized way to build consistent and effective user interfaces.
      </Text>

      <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Form Validation</H2>
      <Text style={{ marginBottom: spacing[16], color: colors.text.light.secondary }}>
        Ensure user input is correct and provide clear feedback.
      </Text>
      <Box
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colors.border.light.default,
          borderRadius: borderRadius.s,
          padding: spacing[16],
          marginBottom: spacing[24],
          backgroundColor: colors.bg.light.default,
        }}
      >
        <Input
          label="Email Address"
          type="email"
          error="Please enter a valid email address."
          fullWidth
        />
      </Box>

      <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Empty States</H2>
      <Text style={{ marginBottom: spacing[16], color: colors.text.light.secondary }}>
        Provide guidance and calls to action when there is no data to display.
      </Text>
      <Box
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colors.border.light.default,
          borderRadius: borderRadius.s,
          padding: spacing[16],
          marginBottom: spacing[24],
          backgroundColor: colors.bg.light.default,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.bg.light.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[8],
          }}
        >
          <Text style={{ fontSize: fontSize.h6, color: colors.text.light.tertiary }}>📦</Text>
        </Box>
        <H3 style={{ fontSize: fontSize.sm, fontWeight: 500, marginTop: spacing[8], color: colors.text.light.primary }}>No items</H3>
        <Text style={{ fontSize: fontSize.sm, color: colors.text.light.secondary, marginTop: spacing[4] }}>Get started by creating a new item.</Text>
        <Box style={{ marginTop: spacing[24] }}>
          <Button variant="primary">
            Create New Item
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PatternsDoc;
