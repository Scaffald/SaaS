/**
 * Background Patterns Token Showcase
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { blocksPattern, netPattern, patternOpacity } from '../../tokens/patterns'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

const meta: Meta = {
  title: 'Tokens/Patterns',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Background pattern tokens from the Figma Forsured Design System.',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const BlocksPattern: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocks Pattern</Text>
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Grid-based pattern with alternating blocks</Text>
          <View style={styles.patternInfo}>
            <Text style={styles.info}>
              Block Size: {blocksPattern.blockSize}px × {blocksPattern.blockSize}px
            </Text>
            <Text style={styles.info}>Gap: {blocksPattern.gap}px</Text>
            <Text style={styles.info}>Border Radius: {blocksPattern.borderRadius}px</Text>
            <Text style={styles.info}>Opacity: {blocksPattern.opacity * 100}%</Text>
          </View>
          <View style={styles.patternPreview}>
            <View
              style={[
                styles.patternBox,
                {
                  backgroundColor: blocksPattern.colors.primary,
                  width: blocksPattern.blockSize,
                  height: blocksPattern.blockSize,
                  borderRadius: blocksPattern.borderRadius,
                  margin: blocksPattern.gap / 2,
                  opacity: blocksPattern.opacity,
                },
              ]}
            />
            <View
              style={[
                styles.patternBox,
                {
                  backgroundColor: blocksPattern.colors.secondary,
                  width: blocksPattern.blockSize,
                  height: blocksPattern.blockSize,
                  borderRadius: blocksPattern.borderRadius,
                  margin: blocksPattern.gap / 2,
                  opacity: blocksPattern.opacity,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  ),
}

export const NetPattern: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Net Pattern</Text>
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Mesh/net pattern with intersecting lines</Text>
          <View style={styles.patternInfo}>
            <Text style={styles.info}>Stroke Color: {netPattern.strokeColor}</Text>
            <Text style={styles.info}>Opacity: {netPattern.opacity * 100}%</Text>
            <Text style={styles.info}>Stroke Width: {netPattern.strokeWidth}px</Text>
          </View>
          <View
            style={[
              styles.netPreview,
              {
                // @ts-expect-error - web-specific CSS for net pattern
                backgroundImage: `
              linear-gradient(${netPattern.strokeColor} ${netPattern.strokeWidth}px, transparent ${netPattern.strokeWidth}px),
              linear-gradient(90deg, ${netPattern.strokeColor} ${netPattern.strokeWidth}px, transparent ${netPattern.strokeWidth}px)
            `,
                backgroundSize: '32px 32px',
                opacity: netPattern.opacity,
              },
            ]}
          >
            <Text style={styles.infoNote}>
              Net pattern with {netPattern.strokeWidth}px lines, {netPattern.opacity * 100}% opacity
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  ),
}

export const PatternOpacity: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pattern Opacity Scale</Text>
        {Object.entries(patternOpacity).map(([name, opacity]) => (
          <View key={name} style={styles.example}>
            <Text style={styles.exampleTitle}>
              {name.charAt(0).toUpperCase() + name.slice(1)}: {opacity * 100}%
            </Text>
            <View style={styles.opacityPreview}>
              <View
                style={[
                  styles.opacityBox,
                  {
                    backgroundColor: colors.primary[500],
                    opacity,
                  },
                ]}
              />
            </View>
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
  example: {
    marginBottom: spacing[24],
    paddingBottom: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.light.tertiary,
    marginBottom: spacing[16],
  },
  patternInfo: {
    gap: spacing[8],
    marginBottom: spacing[16],
  },
  info: {
    fontSize: 12,
    color: colors.text.light.secondary,
    fontFamily: 'monospace',
  },
  infoNote: {
    fontSize: 12,
    color: colors.text.light.tertiary,
    fontStyle: 'italic',
  },
  patternPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing[16],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: spacing[8],
  },
  patternBox: {
    borderWidth: 1,
    borderColor: colors.border.light.default,
  },
  netPreview: {
    padding: spacing[16],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: spacing[8],
    minHeight: 200,
  },
  opacityPreview: {
    padding: spacing[16],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: spacing[8],
  },
  opacityBox: {
    width: '100%',
    height: 60,
    borderRadius: spacing[4],
  },
})
