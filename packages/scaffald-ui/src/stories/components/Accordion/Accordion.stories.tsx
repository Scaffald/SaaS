/**
 * Accordion component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Rect, Path, Circle } from 'react-native-svg'
import { Accordion } from '../../../components/Accordion'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// Example icon components
const DeviceIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="4" width="12" height="16" rx="1" stroke="#141c25" strokeWidth="1.5" />
    <Path d="M10 18H14" stroke="#141c25" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
)

const ClockIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="8" stroke="#1a232d" strokeWidth="1.5" />
    <Path d="M12 8V12L14 14" stroke="#1a232d" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
)

const CardIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="7" width="16" height="10" rx="2" stroke="#ff4d4d" strokeWidth="1.5" />
    <Path d="M4 11H20" stroke="#ff4d4d" strokeWidth="1.5" />
  </Svg>
)

const WarningIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Path
      d="M8 2L14 14H2L8 2Z"
      fill="#f59e0b"
      stroke="#637083"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <Path d="M8 6V9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="8" cy="11" r="0.5" fill="white" />
  </Svg>
)

const InfoIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <Circle cx="8" cy="8" r="6" fill="#f59e0b" stroke="#637083" strokeWidth="1.5" />
    <Path d="M8 7V11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="8" cy="5" r="0.5" fill="white" />
  </Svg>
)

// Basic uncontrolled accordion (single mode)
export const Default: Story = {
  render: () => (
    <View style={styles.container}>
      <Accordion mode="single">
        <Accordion.Item value="item1">
          <Accordion.Trigger
            icon={<DeviceIcon />}
            hintMessage="2 issues"
            hintIcon={<WarningIcon />}
          >
            Connected Devices
          </Accordion.Trigger>
          <Accordion.Content>
            • The battery level of Device 1 is below 20%. Please charge it soon to avoid
            disconnection.{'\n\n'}• Device 2 is experiencing weak signal strength. Move it closer to
            the router for a better connection.
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item2">
          <Accordion.Trigger icon={<ClockIcon />}>Version history</Accordion.Trigger>
          <Accordion.Content>
            View and restore previous versions of your documents. Each version is automatically
            saved when you make changes.
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item3">
          <Accordion.Trigger
            icon={<CardIcon />}
            hintMessage="Please update now!"
            hintIcon={<InfoIcon />}
            hintColor={colors.error[500]}
          >
            Card expired **** 6789
          </Accordion.Trigger>
          <Accordion.Content>
            Your payment card ending in 6789 has expired. Please add a new payment method to
            continue using our services.
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  ),
}

// Single mode - controlled
export const SingleModeControlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('item1')

    return (
      <View style={styles.container}>
        <Accordion mode="single" value={value} onValueChange={setValue as (val: string) => void}>
          <Accordion.Item value="item1">
            <Accordion.Trigger>Section 1</Accordion.Trigger>
            <Accordion.Content>
              This is the content for section 1. Only one section can be open at a time in single
              mode.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item2">
            <Accordion.Trigger>Section 2</Accordion.Trigger>
            <Accordion.Content>
              This is the content for section 2. Click to expand and the previous section will
              collapse.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item3">
            <Accordion.Trigger>Section 3</Accordion.Trigger>
            <Accordion.Content>
              This is the content for section 3. Single mode ensures only one item is expanded.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        <Text style={styles.debug}>Current value: {value || 'none'}</Text>
      </View>
    )
  },
}

// Multiple mode - many items can be open
export const MultipleMode: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['item1', 'item3'])

    return (
      <View style={styles.container}>
        <Accordion
          mode="multiple"
          value={value}
          onValueChange={setValue as (val: string[]) => void}
        >
          <Accordion.Item value="item1">
            <Accordion.Trigger>What is an accordion?</Accordion.Trigger>
            <Accordion.Content>
              An accordion is a menu composed of vertically stacked headers that reveal more details
              when triggered (often by a mouse click). Since this web design pattern highlights only
              the most critical information of a section but makes the rest easily accessible, it's
              a common element in responsive design.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item2">
            <Accordion.Trigger>When should I use an accordion?</Accordion.Trigger>
            <Accordion.Content>
              Use accordions when you have multiple sections of content and want to allow users to
              focus on one section at a time while still being able to quickly navigate between
              sections.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item3">
            <Accordion.Trigger>How do I implement an accordion?</Accordion.Trigger>
            <Accordion.Content>
              Use the Accordion compound component with mode="multiple" to allow multiple items to
              be expanded simultaneously. Each item needs a unique value prop.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>

        <Text style={styles.debug}>Open items: {value.join(', ') || 'none'}</Text>
      </View>
    )
  },
}

// With custom content
export const CustomContent: Story = {
  render: () => (
    <View style={styles.container}>
      <Accordion mode="single">
        <Accordion.Item value="item1">
          <Accordion.Trigger>User Profile</Accordion.Trigger>
          <Accordion.Content>
            <View style={styles.profileContent}>
              <Text style={styles.profileLabel}>Name:</Text>
              <Text style={styles.profileValue}>John Doe</Text>

              <Text style={styles.profileLabel}>Email:</Text>
              <Text style={styles.profileValue}>john@example.com</Text>

              <Text style={styles.profileLabel}>Role:</Text>
              <Text style={styles.profileValue}>Administrator</Text>
            </View>
          </Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item2">
          <Accordion.Trigger>Settings</Accordion.Trigger>
          <Accordion.Content>
            <View style={styles.settingsContent}>
              <Text style={styles.settingItem}>✓ Email notifications</Text>
              <Text style={styles.settingItem}>✓ Push notifications</Text>
              <Text style={styles.settingItem}>✗ SMS notifications</Text>
            </View>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  ),
}

// Width variants
export const WidthVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Constrained (default)</Text>
      <Text style={styles.variantDescription}>
        Maintains consistent width when expanded. Best for forms and structured layouts.
      </Text>
      <Accordion mode="single" width="constrained" defaultValue="item1">
        <Accordion.Item value="item1">
          <Accordion.Trigger>Short title</Accordion.Trigger>
          <Accordion.Content>
            This accordion maintains a consistent width regardless of whether it's expanded or
            collapsed.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item2">
          <Accordion.Trigger>A much longer title that takes up more space</Accordion.Trigger>
          <Accordion.Content>Notice the width stays consistent.</Accordion.Content>
        </Accordion.Item>
      </Accordion>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Fluid</Text>
      <Text style={styles.variantDescription}>
        Adapts to content width. Best for dynamic or variable content.
      </Text>
      <Accordion mode="single" width="fluid" defaultValue="item1">
        <Accordion.Item value="item1">
          <Accordion.Trigger>Short title</Accordion.Trigger>
          <Accordion.Content>
            This accordion's width adapts to its content, so it may change when expanded.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item2">
          <Accordion.Trigger>A much longer title that takes up more space</Accordion.Trigger>
          <Accordion.Content>The width adapts to fit content naturally.</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  ),
}

// Disabled state
export const Disabled: Story = {
  render: () => (
    <View style={styles.container}>
      <Accordion mode="single">
        <Accordion.Item value="item1">
          <Accordion.Trigger>Active Section</Accordion.Trigger>
          <Accordion.Content>This section is active and can be toggled.</Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item2" disabled>
          <Accordion.Trigger>Disabled Section</Accordion.Trigger>
          <Accordion.Content>This section is disabled and cannot be toggled.</Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item3">
          <Accordion.Trigger>Another Active Section</Accordion.Trigger>
          <Accordion.Content>This section is also active.</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  ),
}

// All disabled
export const AllDisabled: Story = {
  render: () => (
    <View style={styles.container}>
      <Accordion mode="single" disabled>
        <Accordion.Item value="item1">
          <Accordion.Trigger>Section 1</Accordion.Trigger>
          <Accordion.Content>Content 1</Accordion.Content>
        </Accordion.Item>

        <Accordion.Item value="item2">
          <Accordion.Trigger>Section 2</Accordion.Trigger>
          <Accordion.Content>Content 2</Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </View>
  ),
}

// Playground matching Figma
export const Playground: Story = {
  render: () => (
    <View style={styles.playgroundContainer}>
      {/* Light theme */}
      <View style={styles.playgroundColumn}>
        <Text style={styles.playgroundTitle}>Light Theme</Text>
        <Accordion mode="single" defaultValue="item4">
          <Accordion.Item value="item1">
            <Accordion.Trigger
              icon={<DeviceIcon />}
              hintMessage="2 issues"
              hintIcon={<WarningIcon />}
            >
              Connected Devices
            </Accordion.Trigger>
            <Accordion.Content>
              • The battery level of Device 1 is below 20%. Please charge it soon to avoid
              disconnection.{'\n\n'}• Device 2 is experiencing weak signal strength. Move it closer
              to the router for a better connection.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item2">
            <Accordion.Trigger icon={<ClockIcon />}>Version history</Accordion.Trigger>
            <Accordion.Content>
              View and restore previous versions of your documents.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item3">
            <Accordion.Trigger
              icon={<CardIcon />}
              hintMessage="Please update now!"
              hintIcon={<InfoIcon />}
              hintColor={colors.error[500]}
            >
              Card expired **** 6789
            </Accordion.Trigger>
            <Accordion.Content>
              Your payment card ending in 6789 has expired. Please add a new payment method.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item4">
            <Accordion.Trigger>What is an accordion?</Accordion.Trigger>
            <Accordion.Content>
              An accordion is a menu composed of vertically stacked headers that reveal more details
              when triggered (often by a mouse click). Since this web design pattern highlights only
              the most critical information of a section but makes the rest easily accessible, it's
              a common element in responsive design.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </View>

      {/* Dark theme */}
      <View style={[styles.playgroundColumn, styles.darkBackground]}>
        <Text style={[styles.playgroundTitle, styles.darkText]}>Dark Theme</Text>
        <Accordion mode="single" defaultValue="item4">
          <Accordion.Item value="item1">
            <Accordion.Trigger
              icon={<DeviceIcon />}
              hintMessage="2 issues"
              hintIcon={<WarningIcon />}
            >
              Connected Devices
            </Accordion.Trigger>
            <Accordion.Content>
              • The battery level of Device 1 is below 20%. Please charge it soon to avoid
              disconnection.{'\n\n'}• Device 2 is experiencing weak signal strength. Move it closer
              to the router for a better connection.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item2">
            <Accordion.Trigger icon={<ClockIcon />}>Version history</Accordion.Trigger>
            <Accordion.Content>
              View and restore previous versions of your documents.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item3">
            <Accordion.Trigger
              icon={<CardIcon />}
              hintMessage="Please update now!"
              hintIcon={<InfoIcon />}
              hintColor={colors.error[500]}
            >
              Card expired **** 6789
            </Accordion.Trigger>
            <Accordion.Content>
              Your payment card ending in 6789 has expired. Please add a new payment method.
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="item4">
            <Accordion.Trigger>What is an accordion?</Accordion.Trigger>
            <Accordion.Content>
              An accordion is a menu composed of vertically stacked headers that reveal more details
              when triggered (often by a mouse click). Since this web design pattern highlights only
              the most critical information of a section but makes the rest easily accessible, it's
              a common element in responsive design.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    minWidth: 500,
    gap: spacing[16],
  },
  debug: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.tertiary,
    marginTop: spacing[16],
  },
  profileContent: {
    gap: spacing[8],
  },
  profileLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.secondary,
  },
  profileValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  settingsContent: {
    gap: spacing[8],
  },
  settingItem: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
  },
  playgroundContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 1000,
  },
  playgroundColumn: {
    flex: 1,
    padding: spacing[80],
    backgroundColor: colors.bg.light.default,
  },
  darkBackground: {
    backgroundColor: colors.gray[900],
  },
  playgroundTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[24],
  },
  darkText: {
    color: colors.text.dark.primary,
  },
  variantTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  variantDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
    marginBottom: spacing[16],
  },
})
