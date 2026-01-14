// src/pages/docs/Changelog.tsx
import React from 'react';
import { Stack, Box, Text, H1, H2 } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize } from '@unicornlove/beyond-ui';

function ChangelogDoc() {
  return (
    <Box style={{ padding: spacing[24] }}>
      <H1 style={{ fontSize: fontSize.h3, fontWeight: 'bold', marginBottom: spacing[16], color: colors.text.light.primary }}>Changelog</H1>
      <Text style={{ fontSize: fontSize.h5, color: colors.text.light.secondary, marginBottom: spacing[24] }}>
        Keep track of all major changes and updates to the ForSured Design System.
      </Text>

      <Box style={{ marginBottom: spacing[32] }}>
        <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Version 1.0.0 - November 28, 2025</H2>
        <Stack style={{ gap: spacing[8], paddingLeft: spacing[16] }}>
          <Text style={{ color: colors.text.light.secondary }}>* Initial release of the ForSured Design System.</Text>
          <Text style={{ color: colors.text.light.secondary }}>* Introduced core components: Button, Input as TextInput, Modal.</Text>
          <Text style={{ color: colors.text.light.secondary }}>* Defined foundational design tokens: Colors, Typography, Spacing.</Text>
          <Text style={{ color: colors.text.light.secondary }}>* Established UI patterns for Form Validation and Empty States.</Text>
        </Stack>
      </Box>

      <Box style={{ marginBottom: spacing[32] }}>
        <H2 style={{ fontSize: fontSize.h4, fontWeight: 600, marginBottom: spacing[12], color: colors.text.light.primary }}>Version 0.9.0 - October 15, 2025</H2>
        <Stack style={{ gap: spacing[8], paddingLeft: spacing[16] }}>
          <Text style={{ color: colors.text.light.secondary }}>* Pre-release version with foundational styles and a limited component set.</Text>
          <Text style={{ color: colors.text.light.secondary }}>* Internal testing and feedback integration.</Text>
        </Stack>
      </Box>
    </Box>
  );
}

export default ChangelogDoc;
