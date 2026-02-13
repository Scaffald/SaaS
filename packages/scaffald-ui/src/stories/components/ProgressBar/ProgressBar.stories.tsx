/**
 * ProgressBar component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState, useEffect } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { ProgressBar } from '../../../components/ProgressBar'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

// Basic progress bar
export const Default: Story = {
  args: {
    value: 40,
    label: 'Uploading...',
    hintMessage: '178MB of 445MB',
  },
}

// Vertical orientation (default)
export const Vertical: Story = {
  args: {
    value: 40,
    label: 'Uploading...',
    hintMessage: '178MB of 445MB',
    orientation: 'vertical',
  },
}

// Horizontal orientation
export const Horizontal: Story = {
  args: {
    value: 62,
    label: 'Uploading...',
    orientation: 'horizontal',
  },
}

// Different progress values
export const ProgressValues: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Progress Values</Text>
      <ProgressBar value={10} label="Uploading..." hintMessage="10%" />
      <ProgressBar value={30} label="Uploading..." hintMessage="30%" />
      <ProgressBar value={50} label="Uploading..." hintMessage="50%" />
      <ProgressBar value={70} label="Uploading..." hintMessage="70%" />
      <ProgressBar value={90} label="Uploading..." hintMessage="90%" />
      <ProgressBar value={100} label="Uploading..." hintMessage="100%" />
    </View>
  ),
}

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Color Variants</Text>
      <ProgressBar value={40} label="Uploading..." color="primary" hintMessage="Primary color" />
      <ProgressBar value={40} label="Uploading..." color="gray" hintMessage="Gray color" />
      <ProgressBar value={90} label="Uploading..." color="error" hintMessage="Error state" />
      <ProgressBar value={100} label="Uploading..." color="success" hintMessage="Success state" />
    </View>
  ),
}

// Indicator icon types
export const IndicatorIconTypes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Indicator Icon Types</Text>
      <ProgressBar
        value={40}
        label="Uploading..."
        indicatorIconType="spinner"
        hintMessage="Loading..."
      />
      <ProgressBar
        value={100}
        label="Complete"
        indicatorIconType="check"
        hintMessage="Upload complete"
      />
      <ProgressBar
        value={49}
        label="Uploading..."
        indicatorIconType="cancel"
        indicatorCustomText="49% (1min left)"
        hintMessage="Can be cancelled"
      />
      <ProgressBar
        value={40}
        label="Uploading..."
        indicatorIconType="none"
        hintMessage="No icon"
      />
    </View>
  ),
}

// Hint message types
export const HintMessageTypes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Hint Message Types</Text>
      <ProgressBar
        value={40}
        label="Uploading..."
        hintMessage="178MB of 445MB"
        hintMessageType="default"
        showHintIcon
      />
      <ProgressBar
        value={90}
        label="Uploading..."
        hintMessage="Oops, something went wrong!"
        hintMessageType="error"
        color="error"
      />
      <ProgressBar
        value={50}
        label="Uploading..."
        hintMessage="Large file, this may take a while"
        hintMessageType="warning"
        showHintIcon
      />
    </View>
  ),
}

// Without label
export const WithoutLabel: Story = {
  args: {
    value: 40,
    showLabel: false,
    hintMessage: '178MB of 445MB',
  },
}

// Without indicator
export const WithoutIndicator: Story = {
  args: {
    value: 40,
    label: 'Uploading...',
    showIndicator: false,
    hintMessage: '178MB of 445MB',
  },
}

// Without hint message
export const WithoutHintMessage: Story = {
  args: {
    value: 40,
    label: 'Uploading...',
    showHintMessage: false,
  },
}

// Custom text in indicator
export const CustomIndicatorText: Story = {
  args: {
    value: 49,
    label: 'Uploading...',
    indicatorCustomText: '49% (1min left)',
    hintMessage: '178MB of 445MB',
  },
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 2
        })
      }, 100)

      return () => clearInterval(interval)
    }, [])

    return (
      <View style={styles.container}>
        <ProgressBar
          value={progress}
          label="Uploading file..."
          hintMessage={`${progress}% complete`}
          indicatorIconType={progress === 100 ? 'check' : 'spinner'}
          color={progress === 100 ? 'success' : 'primary'}
        />
      </View>
    )
  },
}

// Theme comparison
export const ThemeVariants: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.variantsContainer}>
          <ProgressBar
            value={40}
            label="Uploading..."
            hintMessage="178MB of 445MB"
            indicatorIconType="spinner"
          />
          <ProgressBar
            value={100}
            label="Complete"
            hintMessage="Upload complete"
            indicatorIconType="check"
            color="success"
          />
          <ProgressBar
            value={90}
            label="Error"
            hintMessage="Oops, something went wrong!"
            hintMessageType="error"
            color="error"
          />
        </View>
      )}
    </ThemeComparison>
  ),
}

// All orientations and variants
export const AllVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Vertical Orientation</Text>
      <ProgressBar
        value={40}
        label="Uploading..."
        hintMessage="178MB of 445MB"
        orientation="vertical"
      />
      <Text style={styles.sectionTitle}>Horizontal Orientation</Text>
      <ProgressBar
        value={62}
        label="Uploading..."
        orientation="horizontal"
      />
      <Text style={styles.sectionTitle}>Minimal (No Label)</Text>
      <ProgressBar
        value={40}
        showLabel={false}
        hintMessage="178MB of 445MB"
      />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    width: 400,
  },
  variantsContainer: {
    gap: spacing[24],
    padding: spacing[16],
    width: 400,
  },
  sectionTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    lineHeight: typography.h6.lineHeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
})

