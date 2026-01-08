/**
 * StatusIndicator component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import { StatusIndicator } from '../../../components/StatusIndicator'
import { ThemeComparison } from '../../../playground'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusIndicator>

export default meta
type Story = StoryObj<typeof meta>

// Basic status indicator
export const Default: Story = {
  args: {
    type: 'success',
    label: 'Success',
  },
}

// All types - Blank variant
export const AllTypes_Blank: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Types - Blank Variant (Filled Icons)</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="blank" label="Caution Minor" />
        <StatusIndicator type="success" variant="blank" label="Success" />
        <StatusIndicator type="undefined" variant="blank" label="Undefined" />
      </View>
      <View style={styles.row}>
        <StatusIndicator type="in-progress" variant="blank" label="In Progress" />
        <StatusIndicator type="error" variant="blank" label="Error" />
        <StatusIndicator type="help" variant="blank" label="Help" />
      </View>
    </View>
  ),
}

// All types - Light variant
export const AllTypes_Light: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Types - Light Variant (Filled Icons)</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="light" label="Caution Minor" />
        <StatusIndicator type="success" variant="light" label="Success" />
        <StatusIndicator type="undefined" variant="light" label="Undefined" />
      </View>
      <View style={styles.row}>
        <StatusIndicator type="in-progress" variant="light" label="In Progress" />
        <StatusIndicator type="error" variant="light" label="Error" />
        <StatusIndicator type="help" variant="light" label="Help" />
      </View>
    </View>
  ),
}

// All types - Outline variant
export const AllTypes_Outline: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Types - Outline Variant (Filled Icons)</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="outline" label="Caution Minor" />
        <StatusIndicator type="success" variant="outline" label="Success" />
        <StatusIndicator type="undefined" variant="outline" label="Undefined" />
      </View>
      <View style={styles.row}>
        <StatusIndicator type="in-progress" variant="outline" label="In Progress" />
        <StatusIndicator type="error" variant="outline" label="Error" />
        <StatusIndicator type="help" variant="outline" label="Help" />
      </View>
    </View>
  ),
}

// All types - Filled variant
export const AllTypes_Filled: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Types - Filled Variant (Filled Icons)</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="filled" label="Caution Minor" />
        <StatusIndicator type="success" variant="filled" label="Success" />
        <StatusIndicator type="undefined" variant="filled" label="Undefined" />
      </View>
      <View style={styles.row}>
        <StatusIndicator type="in-progress" variant="filled" label="In Progress" />
        <StatusIndicator type="error" variant="filled" label="Error" />
        <StatusIndicator type="help" variant="filled" label="Help" />
      </View>
    </View>
  ),
}

// Icon Types - Linear
export const IconType_Linear: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Linear Icons (All Variants)</Text>
      <Text style={styles.subtitle}>Blank</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="blank" iconType="linear" label="Caution" />
        <StatusIndicator type="success" variant="blank" iconType="linear" label="Success" />
        <StatusIndicator type="error" variant="blank" iconType="linear" label="Error" />
      </View>
      <Text style={styles.subtitle}>Light</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="light" iconType="linear" label="Caution" />
        <StatusIndicator type="success" variant="light" iconType="linear" label="Success" />
        <StatusIndicator type="error" variant="light" iconType="linear" label="Error" />
      </View>
      <Text style={styles.subtitle}>Outline</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="outline" iconType="linear" label="Caution" />
        <StatusIndicator type="success" variant="outline" iconType="linear" label="Success" />
        <StatusIndicator type="error" variant="outline" iconType="linear" label="Error" />
      </View>
      <Text style={styles.subtitle}>Filled</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="filled" iconType="linear" label="Caution" />
        <StatusIndicator type="success" variant="filled" iconType="linear" label="Success" />
        <StatusIndicator type="error" variant="filled" iconType="linear" label="Error" />
      </View>
    </View>
  ),
}

// Icon Types - Dot
export const IconType_Dot: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dot Icons (All Variants)</Text>
      <Text style={styles.subtitle}>Blank</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="blank" iconType="dot" label="Caution" />
        <StatusIndicator type="success" variant="blank" iconType="dot" label="Success" />
        <StatusIndicator type="error" variant="blank" iconType="dot" label="Error" />
      </View>
      <Text style={styles.subtitle}>Light</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="light" iconType="dot" label="Caution" />
        <StatusIndicator type="success" variant="light" iconType="dot" label="Success" />
        <StatusIndicator type="error" variant="light" iconType="dot" label="Error" />
      </View>
      <Text style={styles.subtitle}>Outline</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="outline" iconType="dot" label="Caution" />
        <StatusIndicator type="success" variant="outline" iconType="dot" label="Success" />
        <StatusIndicator type="error" variant="outline" iconType="dot" label="Error" />
      </View>
      <Text style={styles.subtitle}>Filled</Text>
      <View style={styles.row}>
        <StatusIndicator type="caution" variant="filled" iconType="dot" label="Caution" />
        <StatusIndicator type="success" variant="filled" iconType="dot" label="Success" />
        <StatusIndicator type="error" variant="filled" iconType="dot" label="Error" />
      </View>
    </View>
  ),
}

// Theme comparison
export const ThemeComparison_: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.themeContainer}>
          <StatusIndicator type="success" variant="blank" label="Blank Success" />
          <StatusIndicator type="caution" variant="light" label="Light Caution" />
          <StatusIndicator type="error" variant="outline" label="Outline Error" />
          <StatusIndicator type="in-progress" variant="filled" label="Filled In Progress" />
        </View>
      )}
    </ThemeComparison>
  ),
}

// All combinations showcase
export const AllCombinations: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Success Status - All Combinations</Text>

      <Text style={styles.subtitle}>Filled Icon</Text>
      <View style={styles.row}>
        <StatusIndicator type="success" variant="blank" iconType="filled" label="Blank" />
        <StatusIndicator type="success" variant="light" iconType="filled" label="Light" />
        <StatusIndicator type="success" variant="outline" iconType="filled" label="Outline" />
        <StatusIndicator type="success" variant="filled" iconType="filled" label="Filled" />
      </View>

      <Text style={styles.subtitle}>Linear Icon</Text>
      <View style={styles.row}>
        <StatusIndicator type="success" variant="blank" iconType="linear" label="Blank" />
        <StatusIndicator type="success" variant="light" iconType="linear" label="Light" />
        <StatusIndicator type="success" variant="outline" iconType="linear" label="Outline" />
        <StatusIndicator type="success" variant="filled" iconType="linear" label="Filled" />
      </View>

      <Text style={styles.subtitle}>Dot Icon</Text>
      <View style={styles.row}>
        <StatusIndicator type="success" variant="blank" iconType="dot" label="Blank" />
        <StatusIndicator type="success" variant="light" iconType="dot" label="Light" />
        <StatusIndicator type="success" variant="outline" iconType="dot" label="Outline" />
        <StatusIndicator type="success" variant="filled" iconType="dot" label="Filled" />
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    maxWidth: 800,
  },
  themeContainer: {
    gap: spacing[12],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[8],
    color: '#344051',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing[8],
    color: '#637083',
  },
})
