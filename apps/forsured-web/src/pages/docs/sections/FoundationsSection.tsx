import React from 'react';
import { Stack, Row, Box, Text, H1, H2, H3 } from '@scaffald/ui';
import { colors, spacing, fontSize, borderRadius, shadows, fontFamily } from '@scaffald/ui';
import ComponentShowcase from '../../../components/DesignSystem/ComponentShowcase';
import { Palette, Box as BoxIcon, Sun } from 'lucide-react';

export default function FoundationsSection() {
  const colorRamps = [
    { name: 'Primary (Blue)', base: '#0166FF', var: 'primary' },
    { name: 'Secondary (Orange)', base: '#F0A000', var: 'secondary' },
    { name: 'Tertiary (Yellow)', base: '#F2D200', var: 'tertiary' },
    { name: 'Success (Green)', base: '#22C55E', var: 'success' },
    { name: 'Warning (Amber)', base: '#F59E0B', var: 'warning' },
    { name: 'Error (Red)', base: '#EF4444', var: 'error' },
  ];

  const spacingScale = [
    { size: '0', value: '0px', class: 'p-0' },
    { size: '1', value: '4px', class: 'p-1' },
    { size: '2', value: '8px', class: 'p-2' },
    { size: '3', value: '12px', class: 'p-3' },
    { size: '4', value: '16px', class: 'p-4' },
    { size: '6', value: '24px', class: 'p-6' },
    { size: '8', value: '32px', class: 'p-8' },
    { size: '12', value: '48px', class: 'p-12' },
    { size: '16', value: '64px', class: 'p-16' },
  ];

  const shadows = [
    { name: 'Small', class: 'shadow-sm' },
    { name: 'Medium', class: 'shadow-md' },
    { name: 'Large', class: 'shadow-lg' },
    { name: 'Extra Large', class: 'shadow-xl' },
  ];

  return (
    <Stack style={{ gap: spacing[32], marginBottom: spacing[48] }}>
      <Row style={{ alignItems: 'center', gap: spacing[12], marginBottom: spacing[24] }}>
        <Palette color={colors.primary[600]} size={32} />
        <H2 style={{ fontSize: fontSize.h3, fontWeight: 'bold', color: colors.text.light.primary }}>
          Foundations
        </H2>
      </Row>

      <ComponentShowcase
        title="Colors"
        description="Complete color palette with 100-900 weight scales for all brand colors"
      >
        <Row style={{ width: '100%', flexWrap: 'wrap', gap: spacing[24] }}>
          {colorRamps.map((color) => {
            const colorMap: Record<string, any> = {
              primary: colors.primary,
              secondary: colors.secondary,
              tertiary: colors.tertiary,
              success: colors.success,
              warning: colors.warning,
              error: colors.error,
            };
            const colorScale = colorMap[color.var] || colors.primary;
            
            return (
              <Stack key={color.var} style={{ gap: spacing[8], flex: 1, minWidth: 200 }}>
                <Row style={{ fontWeight: 600, color: colors.text.light.primary, marginBottom: spacing[12], alignItems: 'center', gap: spacing[8] }}>
                  <Box
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: borderRadius.xxs,
                      boxShadow: shadows.s.boxShadow,
                      backgroundColor: color.base,
                    }}
                  />
                  <Text>{color.name}</Text>
                </Row>
                <Stack style={{ gap: spacing[4] }}>
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                    <Row key={weight} style={{ alignItems: 'center', gap: spacing[8] }}>
                      <Box
                        style={{
                          width: 64,
                          height: 32,
                          borderRadius: borderRadius.xxs,
                          boxShadow: shadows.s.boxShadow,
                          border: `1px solid ${colors.border.light.default}`,
                          backgroundColor: colorScale[weight as keyof typeof colorScale] || colorScale[500],
                        }}
                      />
                      <Text style={{ fontSize: fontSize.xs, fontFamily: fontFamily.mono, color: colors.text.light.secondary }}>
                        {weight}
                      </Text>
                    </Row>
                  ))}
                </Stack>
              </Stack>
            );
          })}
        </Row>
      </ComponentShowcase>

      <ComponentShowcase
        title="Typography"
        description="Font families, sizes, and weights used throughout the system"
      >
        <Stack style={{ width: '100%', gap: spacing[24] }}>
          <Box>
            <Text style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.text.light.secondary, marginBottom: spacing[12] }}>
              Display Font (Roboto Serif)
            </Text>
            <H1 style={{ fontFamily: fontFamily.serif, fontSize: fontSize.h1, fontWeight: 'bold', color: colors.text.light.primary }}>
              The quick brown fox
            </H1>
            <H2 style={{ fontFamily: fontFamily.serif, fontSize: fontSize.h3, fontWeight: 'bold', color: colors.text.light.primary, marginTop: spacing[8] }}>
              The quick brown fox
            </H2>
            <H3 style={{ fontFamily: fontFamily.serif, fontSize: fontSize.h4, fontWeight: 'bold', color: colors.text.light.primary, marginTop: spacing[8] }}>
              The quick brown fox
            </H3>
          </Box>
          <Box>
            <Text style={{ fontSize: fontSize.sm, fontWeight: 600, color: colors.text.light.secondary, marginBottom: spacing[12] }}>
              Body Font (Roboto)
            </Text>
            <Text style={{ fontSize: fontSize.h6, color: colors.text.light.primary }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: fontSize.lg, color: colors.text.light.primary, marginTop: spacing[8] }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.text.light.primary, marginTop: spacing[8] }}>
              The quick brown fox jumps over the lazy dog
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.text.light.primary, marginTop: spacing[8] }}>
              The quick brown fox jumps over the lazy dog
            </Text>
          </Box>
        </Stack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Spacing System"
        description="8px-based spacing scale for consistent layouts"
      >
        <Stack style={{ width: '100%', gap: spacing[8] }}>
          {spacingScale.map((space) => {
            const spacingValue = spacing[parseInt(space.size) * 4 as keyof typeof spacing] || 0;
            return (
              <Row key={space.size} style={{ alignItems: 'center', gap: spacing[16] }}>
                <Text style={{ fontSize: fontSize.sm, fontFamily: fontFamily.mono, color: colors.text.light.secondary, width: 48 }}>
                  {space.class}
                </Text>
                <Box
                  style={{
                    backgroundColor: colors.primary[100],
                    width: spacingValue,
                    height: 32,
                  }}
                />
                <Text style={{ fontSize: fontSize.sm, color: colors.text.light.tertiary }}>{space.value}</Text>
              </Row>
            );
          })}
        </Stack>
      </ComponentShowcase>

      <ComponentShowcase
        title="Shadows"
        description="Elevation system using box shadows"
      >
        <Row style={{ width: '100%', flexWrap: 'wrap', gap: spacing[24] }}>
          {shadows.map((shadow, index) => {
            const shadowMap = [shadows.xs, shadows.s, shadows.m, shadows.l];
            const currentShadow = shadowMap[index] || shadows.s;
            return (
              <Stack key={shadow.name} style={{ alignItems: 'center', flex: 1, minWidth: 140 }}>
                <Box
                  style={{
                    width: '100%',
                    height: 96,
                    backgroundColor: colors.bg.light.default,
                    borderRadius: borderRadius.s,
                    boxShadow: currentShadow.boxShadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: fontSize.sm, fontWeight: 500, color: colors.text.light.primary }}>
                    {shadow.name}
                  </Text>
                </Box>
                <Text style={{ fontSize: fontSize.xs, color: colors.text.light.secondary, marginTop: spacing[8], fontFamily: fontFamily.mono }}>
                  {shadow.class}
                </Text>
              </Stack>
            );
          })}
        </Row>
      </ComponentShowcase>

      <ComponentShowcase
        title="Themes"
        description="Light, Dark, and Earth theme variations"
      >
        <Stack style={{ width: '100%', gap: spacing[16] }}>
          <Row style={{ flexWrap: 'wrap', gap: spacing[16] }}>
            <Box style={{ flex: 1, minWidth: 180, backgroundColor: colors.bg.light.default, border: `1px solid ${colors.gray[300]}`, borderRadius: borderRadius.s, padding: spacing[16], display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#eab308" size={32} />
              <Text style={{ fontWeight: 600, color: colors.gray[900], marginTop: spacing[8] }}>Light Theme</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.gray[700], marginTop: spacing[4] }}>Clean and bright</Text>
            </Box>
            <Box style={{ flex: 1, minWidth: 180, backgroundColor: colors.gray[900], border: `1px solid ${colors.gray[600]}`, borderRadius: borderRadius.s, padding: spacing[16], display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#60a5fa" size={32} />
              <Text style={{ fontWeight: 600, color: 'white', marginTop: spacing[8] }}>Dark Theme</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.gray[400], marginTop: spacing[4] }}>Low-light optimized</Text>
            </Box>
            <Box style={{ flex: 1, minWidth: 180, backgroundColor: colors.secondary[50], border: `1px solid ${colors.secondary[300]}`, borderRadius: borderRadius.s, padding: spacing[16], display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Sun color="#ea580c" size={32} />
              <Text style={{ fontWeight: 600, color: colors.secondary[900], marginTop: spacing[8] }}>Earth Theme</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.secondary[700], marginTop: spacing[4] }}>Warm and natural</Text>
            </Box>
          </Row>
          <Text style={{ fontSize: fontSize.sm, color: colors.text.light.secondary, textAlign: 'center' }}>
            Use the theme switcher in the top right to preview all themes
          </Text>
        </Stack>
      </ComponentShowcase>
    </Stack>
  );
}
