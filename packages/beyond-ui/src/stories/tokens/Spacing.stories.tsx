/**
 * Spacing Token Showcase
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { spacing, namedSpacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'

const meta: Meta = {
  title: 'Tokens/Spacing',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Spacing tokens from the Figma Forsured Design System.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const SpacingExample = ({ name, value }: { name: string; value: number }) => (
  <View style={styles.example}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{name}</Text>
      <Text style={styles.value}>{value}px</Text>
    </View>
    <View style={[styles.visual, { minHeight: Math.max(40, value + 8) }]}>
      <View style={[styles.box, { width: value, height: value }]} />
    </View>
  </View>
)

export const SpacingScale: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spacing Primitives</Text>
        <View style={styles.grid}>
          {Object.entries(spacing).map(([key, value]) => (
            <SpacingExample key={key} name={key.toString()} value={value} />
          ))}
        </View>
      </View>
    </ScrollView>
  ),
}

export const NamedSpacing: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Named Spacing</Text>
        <View style={styles.grid}>
          {Object.entries(namedSpacing).map(([key, value]) => (
            <SpacingExample key={key} name={key} value={value} />
          ))}
        </View>
      </View>
    </ScrollView>
  ),
}

export const SpacingInContext: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spacing in Context</Text>
        <View style={styles.contextExample}>
          <View style={[styles.card, { padding: spacing[16], gap: spacing[8] }]}>
            <Text style={styles.cardTitle}>Card with padding: 16 (spacing[16])</Text>
            <View style={[styles.card, { padding: spacing[8], gap: spacing[4] }]}>
              <Text style={styles.cardText}>Nested card with padding: 8</Text>
              <Text style={styles.cardText}>Gap between items: 4</Text>
            </View>
          </View>
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
  grid: {
    gap: spacing[16],
  },
  example: {
    gap: spacing[8],
    paddingVertical: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.light.primary,
  },
  value: {
    fontSize: 12,
    color: colors.text.light.tertiary,
    fontFamily: 'monospace',
  },
  visual: {
    justifyContent: 'center',
    paddingVertical: spacing[4],
  },
  box: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xs,
  },
  contextExample: {
    gap: spacing[16],
  },
  card: {
    backgroundColor: colors.bg.light.subtle,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.light.primary,
  },
  cardText: {
    fontSize: 14,
    color: colors.text.light.secondary,
  },
})
