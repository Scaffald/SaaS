/**
 * Dividers Token Showcase
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { dividerStyles } from '../../tokens/dividers'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

const meta: Meta = {
  title: 'Tokens/Dividers',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Divider tokens from the Figma Forsured Design System.',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const DividerVariants: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Divider Variants</Text>

        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Default Horizontal Divider</Text>
          <View style={styles.content}>
            <Text style={styles.text}>Content above</Text>
            <View style={[styles.divider, dividerStyles.horizontal]} />
            <Text style={styles.text}>Content below</Text>
          </View>
        </View>

        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Vertical Divider</Text>
          <View style={styles.horizontalContent}>
            <Text style={styles.text}>Left content</Text>
            <View style={[styles.dividerVertical, dividerStyles.vertical]} />
            <Text style={styles.text}>Right content</Text>
          </View>
        </View>

        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Thick Horizontal Divider</Text>
          <View style={styles.content}>
            <Text style={styles.text}>Content above</Text>
            <View style={[styles.divider, dividerStyles.horizontalThick]} />
            <Text style={styles.text}>Content below</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  ),
}

export const DividerWithText: Story = {
  render: () => (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Divider with Text</Text>
        <View style={styles.example}>
          <View style={styles.dividerWithText}>
            <View style={[styles.divider, { flex: 1, marginRight: spacing[8] }]} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={[styles.divider, { flex: 1, marginLeft: spacing[8] }]} />
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
  content: {
    gap: spacing[16],
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  text: {
    fontSize: 14,
    color: colors.text.light.primary,
  },
  divider: {
    height: 1,
  },
  dividerVertical: {
    width: 1,
    height: 40,
  },
  dividerWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerText: {
    fontSize: 12,
    color: colors.text.light.tertiary,
    paddingHorizontal: spacing[8],
    backgroundColor: colors.bg.light.default, // Background to make text appear on top of line
  },
})
