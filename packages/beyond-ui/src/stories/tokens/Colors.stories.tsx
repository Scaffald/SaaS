/**
 * Colors Token Showcase
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'

const meta: Meta = {
  title: 'Tokens/Colors',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Color tokens from the Figma Forsured Design System.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const ColorSwatch = ({ name, color, value }: { name: string; color: string; value: string }) => (
  <View style={styles.swatch}>
    <View style={[styles.colorBox, { backgroundColor: color }]} />
    <View style={styles.colorInfo}>
      <Text style={styles.colorName}>{name}</Text>
      <Text style={styles.colorValue}>{value}</Text>
    </View>
  </View>
)

const ColorScale = ({
  title,
  colorScale,
}: {
  title: string
  colorScale: Record<string, string>
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.swatchGrid}>
      {Object.entries(colorScale).map(([key, value]) => (
        <ColorSwatch key={key} name={key} color={value} value={value} />
      ))}
    </View>
  </View>
)

export const BrandColors: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <ColorScale title="Primary" colorScale={colors.primary} />
    </ScrollView>
  ),
}

export const GrayScale: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <ColorScale title="Base/Gray Scale" colorScale={colors.gray} />
    </ScrollView>
  ),
}

export const SemanticColors: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <ColorScale title="Success" colorScale={colors.success} />
      <ColorScale title="Warning" colorScale={colors.warning} />
      <ColorScale title="Error" colorScale={colors.error} />
      <ColorScale title="Info" colorScale={colors.info} />
    </ScrollView>
  ),
}

export const TextColors: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Light Mode Text Colors</Text>
        <View style={styles.swatchGrid}>
          <ColorSwatch
            name="Primary"
            color={colors.text.light.primary}
            value={colors.text.light.primary}
          />
          <ColorSwatch
            name="Secondary"
            color={colors.text.light.secondary}
            value={colors.text.light.secondary}
          />
          <ColorSwatch
            name="Tertiary"
            color={colors.text.light.tertiary}
            value={colors.text.light.tertiary}
          />
          <ColorSwatch
            name="Disabled"
            color={colors.text.light.disabled}
            value={colors.text.light.disabled}
          />
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: colors.bg.dark.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.dark.primary }]}>
          Dark Mode Text Colors
        </Text>
        <View style={styles.swatchGrid}>
          <ColorSwatch
            name="Primary"
            color={colors.text.dark.primary}
            value={colors.text.dark.primary}
          />
          <ColorSwatch
            name="Secondary"
            color={colors.text.dark.secondary}
            value={colors.text.dark.secondary}
          />
          <ColorSwatch
            name="Tertiary"
            color={colors.text.dark.tertiary}
            value={colors.text.dark.tertiary}
          />
          <ColorSwatch
            name="Disabled"
            color={colors.text.dark.disabled}
            value={colors.text.dark.disabled}
          />
        </View>
      </View>
    </ScrollView>
  ),
}

export const BackgroundColors: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Light Mode Background Colors</Text>
        <View style={styles.swatchGrid}>
          <ColorSwatch
            name="Default"
            color={colors.bg.light.default}
            value={colors.bg.light.default}
          />
          <ColorSwatch
            name="Subtle"
            color={colors.bg.light.subtle}
            value={colors.bg.light.subtle}
          />
          <ColorSwatch name="Muted" color={colors.bg.light.muted} value={colors.bg.light.muted} />
          <ColorSwatch
            name="Emphasis"
            color={colors.bg.light.emphasis}
            value={colors.bg.light.emphasis}
          />
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: colors.bg.dark.default }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.dark.primary }]}>
          Dark Mode Background Colors
        </Text>
        <View style={styles.swatchGrid}>
          <ColorSwatch
            name="Default"
            color={colors.bg.dark.default}
            value={colors.bg.dark.default}
          />
          <ColorSwatch name="Subtle" color={colors.bg.dark.subtle} value={colors.bg.dark.subtle} />
          <ColorSwatch name="Muted" color={colors.bg.dark.muted} value={colors.bg.dark.muted} />
          <ColorSwatch
            name="Emphasis"
            color={colors.bg.dark.emphasis}
            value={colors.bg.dark.emphasis}
          />
        </View>
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
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
  },
  swatch: {
    width: 150,
    gap: spacing[8],
  },
  colorBox: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.s,
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  colorInfo: {
    gap: spacing[4],
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.light.primary,
  },
  colorValue: {
    fontSize: 12,
    color: colors.text.light.tertiary,
    fontFamily: 'monospace',
  },
})
