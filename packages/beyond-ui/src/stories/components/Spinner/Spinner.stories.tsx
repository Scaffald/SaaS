/**
 * Spinner component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import { Spinner } from '../../../components/Spinner'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography, fontSize, lineHeight } from '../../../tokens/typography'

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

// Basic spinner
export const Default: Story = {
  args: {
    size: 'md',
    color: 'primary',
  },
}

// Size variants
export const Sizes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Size Variants</Text>
      <View style={styles.sizeRow}>
        <View style={styles.sizeItem}>
          <Spinner size="xs" color="gray" />
          <Text style={styles.sizeLabel}>Extra Small (48px)</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="sm" color="gray" />
          <Text style={styles.sizeLabel}>Small (64px)</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="md" color="gray" />
          <Text style={styles.sizeLabel}>Medium (80px)</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="lg" color="gray" />
          <Text style={styles.sizeLabel}>Large (96px)</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="xl" color="gray" />
          <Text style={styles.sizeLabel}>Extra Large (128px)</Text>
        </View>
      </View>
    </View>
  ),
}

// Color variants
export const Colors: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Color Variants</Text>
      <View style={styles.colorRow}>
        <View style={styles.colorItem}>
          <Spinner size="md" color="gray" />
          <Text style={styles.colorLabel}>Base Gray</Text>
        </View>
        <View style={styles.colorItem}>
          <Spinner size="md" color="primary" />
          <Text style={styles.colorLabel}>Primary (Brand)</Text>
        </View>
      </View>
    </View>
  ),
}

// All sizes with primary color
export const AllSizesPrimary: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>All Sizes - Primary Color</Text>
      <View style={styles.sizeRow}>
        <View style={styles.sizeItem}>
          <Spinner size="xs" color="primary" />
          <Text style={styles.sizeLabel}>XS</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="sm" color="primary" />
          <Text style={styles.sizeLabel}>SM</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="md" color="primary" />
          <Text style={styles.sizeLabel}>MD</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="lg" color="primary" />
          <Text style={styles.sizeLabel}>LG</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="xl" color="primary" />
          <Text style={styles.sizeLabel}>XL</Text>
        </View>
      </View>
    </View>
  ),
}

// All sizes with gray color
export const AllSizesGray: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>All Sizes - Base Gray</Text>
      <View style={styles.sizeRow}>
        <View style={styles.sizeItem}>
          <Spinner size="xs" color="gray" />
          <Text style={styles.sizeLabel}>XS</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="sm" color="gray" />
          <Text style={styles.sizeLabel}>SM</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="md" color="gray" />
          <Text style={styles.sizeLabel}>MD</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="lg" color="gray" />
          <Text style={styles.sizeLabel}>LG</Text>
        </View>
        <View style={styles.sizeItem}>
          <Spinner size="xl" color="gray" />
          <Text style={styles.sizeLabel}>XL</Text>
        </View>
      </View>
    </View>
  ),
}

// With loading text (matching Figma design)
export const WithLoadingText: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>With Loading Text</Text>
      <View style={styles.spinnerWithText}>
        <Spinner size="md" color="gray" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
      <View style={styles.spinnerWithText}>
        <Spinner size="lg" color="primary" />
        <Text style={styles.loadingTextLarge}>Loading...</Text>
      </View>
    </View>
  ),
}

// Theme comparison
export const ThemeVariants: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.variantsContainer}>
          <View style={styles.themeRow}>
            <View style={styles.themeItem}>
              <Spinner size="md" color="gray" />
              <Text style={styles.themeLabel}>Gray</Text>
            </View>
            <View style={styles.themeItem}>
              <Spinner size="md" color="primary" />
              <Text style={styles.themeLabel}>Primary</Text>
            </View>
          </View>
        </View>
      )}
    </ThemeComparison>
  ),
}

// Visibility toggle
export const Visibility: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Visibility Control</Text>
      <View style={styles.visibilityRow}>
        <View style={styles.visibilityItem}>
          <Spinner size="md" color="primary" visible={true} />
          <Text style={styles.visibilityLabel}>Visible</Text>
        </View>
        <View style={styles.visibilityItem}>
          <Spinner size="md" color="primary" visible={false} />
          <Text style={styles.visibilityLabel}>Hidden</Text>
        </View>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    alignItems: 'center',
  },
  variantsContainer: {
    gap: spacing[24],
    padding: spacing[16],
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    lineHeight: typography.h6.lineHeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sizeItem: {
    alignItems: 'center',
    gap: spacing[12],
    minWidth: 100,
  },
  sizeLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[32],
    justifyContent: 'center',
  },
  colorItem: {
    alignItems: 'center',
    gap: spacing[16],
  },
  colorLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.md,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.md,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
  spinnerWithText: {
    alignItems: 'center',
    gap: spacing[12],
  },
  loadingText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
  loadingTextLarge: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.md,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.md,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[32],
    justifyContent: 'center',
  },
  themeItem: {
    alignItems: 'center',
    gap: spacing[16],
  },
  themeLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.md,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.md,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[32],
    justifyContent: 'center',
  },
  visibilityItem: {
    alignItems: 'center',
    gap: spacing[16],
    width: 80,
    height: 80,
    justifyContent: 'center',
  },
  visibilityLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    color: colors.text.light.secondary,
    textAlign: 'center',
  },
})

