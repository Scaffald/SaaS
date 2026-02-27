/**
 * Toggle component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Toggle } from '../../../components/Toggle'
import { Playground, PlaygroundSection, ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

// Basic toggle (uncontrolled - manages its own state)
export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
}

// Uncontrolled mode - component manages its own state
export const Uncontrolled: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Click to toggle (no state management needed)</Text>
      <Toggle label="Dark mode" />
      <Toggle label="Notifications" onChange={(checked) => console.log('Changed to:', checked)} />
      <Toggle label="Auto-save" helperText="Changes are saved automatically" />
    </View>
  ),
}

// Controlled toggle example
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <Toggle
        checked={checked}
        onChange={setChecked}
        label={`Toggle is ${checked ? 'on' : 'off'}`}
      />
    )
  },
}

// All sizes
export const Sizes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Small</Text>
        <Toggle size="sm" checked label="Small toggle" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Medium</Text>
        <Toggle size="md" checked label="Medium toggle" />
      </View>
    </View>
  ),
}

// All colors
export const Colors: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Primary</Text>
        <Toggle color="primary" checked label="Primary color" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Gray</Text>
        <Toggle color="gray" checked label="Gray color" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Red-Green</Text>
        <Toggle color="red-green" checked label="Red-Green color" />
      </View>
    </View>
  ),
}

// All states
export const States: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Off States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Toggle label="Default state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Toggle disabled label="Disabled state" />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>On States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Toggle checked label="On state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Toggle checked disabled label="On disabled" />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>Red-Green States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Off (Red)</Text>
        <Toggle color="red-green" label="Off (error state)" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>On (Green)</Text>
        <Toggle color="red-green" checked label="On (success state)" />
      </View>
    </View>
  ),
}

// Without label
export const WithoutLabel: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Off</Text>
        <Toggle />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>On</Text>
        <Toggle checked />
      </View>
    </View>
  ),
}

// Form example
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      notifications: false,
      darkMode: false,
      autoSave: true,
    })

    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Settings</Text>
        <Toggle
          checked={formData.notifications}
          onChange={(checked) => setFormData({ ...formData, notifications: checked })}
          label="Email Notifications"
          helperText="Receive email updates about your account"
        />
        <Toggle
          checked={formData.darkMode}
          onChange={(checked) => setFormData({ ...formData, darkMode: checked })}
          label="Dark Mode"
          helperText="Switch to dark theme"
        />
        <Toggle
          checked={formData.autoSave}
          onChange={(checked) => setFormData({ ...formData, autoSave: checked })}
          color="red-green"
          label="Auto Save"
          helperText="Automatically save your work"
        />
      </View>
    )
  },
}

// Playground example matching Figma design
export const PlaygroundExample: Story = {
  render: () => {
    const ToggleExamples = () => (
      <View style={styles.playgroundContent}>
        <PlaygroundSection title="Basic Toggles">
          <View style={styles.playgroundExamples}>
            <Toggle size="md" label="Label" />
            <Toggle size="md" checked label="Complete Tasks" />
            <Toggle size="md" label="Email Notifications" optional helperText="Helper text" />
            <Toggle size="md" checked label="Dark Mode" disabled />
          </View>
        </PlaygroundSection>

        <PlaygroundSection title="Red-Green Variant">
          <View style={styles.playgroundExamples}>
            <Toggle size="md" color="red-green" label="Label" />
            <Toggle
              size="md"
              color="red-green"
              checked
              label="Email Notifications"
              optional
              helperText="Helper text"
            />
          </View>
        </PlaygroundSection>

        <PlaygroundSection title="All Colors">
          <View style={styles.playgroundExamples}>
            <Toggle size="md" color="gray" checked label="Gray toggle" />
            <Toggle size="md" color="primary" checked label="Primary toggle" />
            <Toggle size="md" color="red-green" checked label="Red-Green toggle" />
          </View>
        </PlaygroundSection>

        <PlaygroundSection title="All Sizes">
          <View style={styles.playgroundExamples}>
            <Toggle size="sm" checked label="Small toggle" />
            <Toggle size="md" checked label="Medium toggle" />
          </View>
        </PlaygroundSection>
      </View>
    )

    return (
      <Playground>
        <ThemeComparison>
          <ToggleExamples />
        </ThemeComparison>
      </Playground>
    )
  },
}

// Helper text examples
export const WithHelperText: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Toggle
          label="Enable feature"
          helperText="This will activate the new feature for your account"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Optional</Text>
        <Toggle
          label="Email notifications"
          optional
          helperText="We'll send you updates about your account"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>On</Text>
        <Toggle checked label="Auto-save enabled" helperText="Your work is automatically saved" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Toggle
          disabled
          label="Premium feature"
          helperText="This option is only available for premium users"
        />
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  playgroundContent: {
    gap: spacing[40],
    width: '100%',
  },
  playgroundExamples: {
    gap: spacing[32],
  },
  variantsContainer: {
    gap: spacing[12],
    minWidth: 400,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  variantLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.secondary,
    width: 100,
  },
  sectionTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  formContainer: {
    gap: spacing[12],
    minWidth: 400,
    padding: spacing[20],
    backgroundColor: colors.bg.light.default,
    borderRadius: 8,
  },
  formTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
})
