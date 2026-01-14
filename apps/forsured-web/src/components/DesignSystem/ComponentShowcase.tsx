import React, { ReactNode } from 'react';
import { Stack, Row, Text, H3, Box } from '@unicornlove/beyond-ui';
import { colors, spacing, fontSize, borderRadius, shadows } from '@unicornlove/beyond-ui';

export interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function ComponentShowcase({
  title,
  description,
  children,
}: ComponentShowcaseProps) {
  return (
    <Box
      id={title.toLowerCase().replace(/\s+/g, '-')}
      style={{
        backgroundColor: colors.bg.light.default,
        borderRadius: borderRadius.xl,
        border: `1px solid ${colors.border.light.default}`,
        boxShadow: shadows.s.boxShadow,
      }}
    >
      <Box style={{ paddingLeft: spacing[24], paddingRight: spacing[24], paddingTop: spacing[16], paddingBottom: spacing[16], borderBottom: `1px solid ${colors.border.light.default}` }}>
        <H3 style={{ fontSize: fontSize.h5, fontWeight: 600, color: colors.text.light.primary }}>{title}</H3>
        {description && (
          <Text style={{ fontSize: fontSize.sm, color: colors.text.light.secondary, marginTop: spacing[4] }}>{description}</Text>
        )}
      </Box>
      <Box style={{ padding: spacing[24] }}>
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: spacing[16],
            padding: spacing[32],
            backgroundColor: colors.bg.light.secondary,
            borderRadius: borderRadius.s,
            border: `1px solid ${colors.border.light.default}`,
            minHeight: 120,
          }}
        >
          {children}
        </Row>
      </Box>
    </Box>
  );
}
