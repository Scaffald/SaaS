// src/pages/docs/Tokens.tsx
import React from 'react';
import { Stack, Row, Box, Text, H1, H2 } from '@scaffald/ui';
import { colors, spacing, fontSize, borderRadius, shadows } from '@scaffald/ui';

function TokensDoc() {
  return (
    <Box style={{ padding: spacing[24] }}>
      <H1 style={{ fontSize: fontSize.h3, fontWeight: 'bold', marginBottom: spacing[16], color: colors.text.light.primary }}>Design Tokens</H1>
      <Text style={{ fontSize: fontSize.h5, color: colors.text.light.secondary, marginBottom: spacing[24] }}>
        Our design tokens are the visual atoms of our design system. They represent the smallest, indivisible pieces of design information that are used to build our UI.
      </Text>

      <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Colors</H2>
      <Text style={{ marginBottom: spacing[16], color: colors.text.light.secondary }}>
        We use a semantic color palette to ensure consistent meaning and usage across the application.
      </Text>
      <Row style={{ flexWrap: 'wrap', gap: spacing[16], marginBottom: spacing[24] }}>
        <Box style={{ padding: spacing[16], borderWidth: 1, borderStyle: 'solid', borderColor: colors.border.light.default, borderRadius: borderRadius.s, boxShadow: shadows.s.boxShadow, backgroundColor: colors.bg.light.default }}>
          <Box style={{ width: 96, height: 96, backgroundColor: colors.primary[500], borderRadius: borderRadius.xs, marginBottom: spacing[8] }} />
          <Text style={{ fontWeight: 500, color: colors.text.light.primary }}>Primary 500</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>#FB612A</Text>
        </Box>
        <Box style={{ padding: spacing[16], borderWidth: 1, borderStyle: 'solid', borderColor: colors.border.light.default, borderRadius: borderRadius.s, boxShadow: shadows.s.boxShadow, backgroundColor: colors.bg.light.default }}>
          <Box style={{ width: 96, height: 96, backgroundColor: colors.success[500], borderRadius: borderRadius.xs, marginBottom: spacing[8] }} />
          <Text style={{ fontWeight: 500, color: colors.text.light.primary }}>Success 500</Text>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>#22C55E</Text>
        </Box>
      </Row>

      <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Typography</H2>
      <Text style={{ marginBottom: spacing[16], color: colors.text.light.secondary }}>
        Our typography scale defines consistent font sizes, weights, and line heights.
      </Text>
      <Stack style={{ marginBottom: spacing[24], gap: spacing[8] }}>
        <Text style={{ fontSize: fontSize.h3, fontWeight: 'bold', marginBottom: spacing[8], color: colors.text.light.primary }}>Heading 1 (text-4xl font-bold)</Text>
        <Text style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[8], color: colors.text.light.primary }}>Heading 2 (text-3xl font-semibold)</Text>
        <Text style={{ fontSize: fontSize.md, marginBottom: spacing[8], color: colors.text.light.primary }}>Body (text-base)</Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>Small text (text-sm)</Text>
      </Stack>

      <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Spacing</H2>
      <Text style={{ marginBottom: spacing[16], color: colors.text.light.secondary }}>
        Our spacing scale ensures consistent visual rhythm and hierarchy.
      </Text>
      <Row style={{ alignItems: 'flex-end', marginBottom: spacing[24], gap: spacing[8] }}>
        <Box style={{ backgroundColor: colors.primary[100], padding: spacing[8] }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>Small (p-2)</Text>
        </Box>
        <Box style={{ backgroundColor: colors.primary[100], padding: spacing[16] }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>Medium (p-4)</Text>
        </Box>
        <Box style={{ backgroundColor: colors.primary[100], padding: spacing[32] }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary }}>Large (p-8)</Text>
        </Box>
      </Row>
    </Box>
  );
}

export default TokensDoc;
