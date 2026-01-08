/**
 * Typography Token Showcase
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { typographyVariants, fontSize, fontWeight, fontFamily } from '../../tokens/typography'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

const meta: Meta = {
  title: 'Tokens/Typography',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Typography tokens from the Figma Forsured Design System.',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const TypographyVariants: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typography Variants</Text>
        {Object.entries(typographyVariants).map(([name, variant]) => (
          <View key={name} style={styles.variantExample}>
            <Text style={styles.variantName}>{name}</Text>
            <Text
              style={[
                styles.variantText,
                {
                  fontFamily: variant.fontFamily,
                  fontSize: variant.fontSize,
                  fontWeight: variant.fontWeight,
                  lineHeight: variant.lineHeight,
                  letterSpacing: variant.letterSpacing,
                },
              ]}
            >
              The quick brown fox jumps over the lazy dog
            </Text>
            <View style={styles.variantDetails}>
              <Text style={styles.detail}>Font: {variant.fontFamily}</Text>
              <Text style={styles.detail}>Size: {variant.fontSize}px</Text>
              <Text style={styles.detail}>Weight: {variant.fontWeight}</Text>
              <Text style={styles.detail}>Line Height: {variant.lineHeight}px</Text>
              {variant.letterSpacing && (
                <Text style={styles.detail}>Letter Spacing: {variant.letterSpacing}px</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  ),
}

export const FontSizes: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Sizes</Text>
        {Object.entries(fontSize).map(([name, size]) => (
          <View key={name} style={styles.sizeExample}>
            <Text style={styles.sizeLabel}>{name}</Text>
            <Text style={[styles.sizeText, { fontSize: size }]}>
              {size}px - The quick brown fox jumps over the lazy dog
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  ),
}

export const FontWeights: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Weights</Text>
        {Object.entries(fontWeight).map(([name, weight]) => (
          <View key={name} style={styles.weightExample}>
            <Text style={styles.weightLabel}>{name}</Text>
            <Text style={[styles.weightText, { fontWeight: weight }]}>
              {weight} - The quick brown fox jumps over the lazy dog
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  ),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[16],
    backgroundColor: colors.bg.light.default,
  },
  section: {
    marginBottom: spacing[32],
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing[16],
    color: colors.text.light.primary,
  },
  variantExample: {
    marginBottom: spacing[24],
    paddingBottom: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  variantName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.light.tertiary,
    marginBottom: spacing[8],
    textTransform: 'uppercase',
  },
  variantText: {
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  variantDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  detail: {
    fontSize: 12,
    color: colors.text.light.tertiary,
    fontFamily: 'monospace',
  },
  sizeExample: {
    marginBottom: spacing[16],
    paddingBottom: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.light.tertiary,
    marginBottom: spacing[8],
  },
  sizeText: {
    color: colors.text.light.primary,
    fontFamily: fontFamily.base,
  },
  weightExample: {
    marginBottom: spacing[16],
    paddingBottom: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.light.tertiary,
    marginBottom: spacing[8],
  },
  weightText: {
    fontSize: fontSize.md,
    color: colors.text.light.primary,
    fontFamily: fontFamily.base,
  },
})
