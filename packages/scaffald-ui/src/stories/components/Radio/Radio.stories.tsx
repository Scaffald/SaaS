/**
 * Radio component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Radio } from '../../../components/Radio'
import { RadioGroup } from '../../../components/Radio'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

// Basic radio (uncontrolled - manages its own state)
export const Default: Story = {
  args: {
    label: 'Option 1',
  },
}

// Uncontrolled mode - component manages its own state
export const Uncontrolled: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Click to toggle (no state management needed)</Text>
      <Radio label="Enable feature" />
      <Radio
        label="Subscribe to updates"
        onChange={(checked) => console.log('Changed to:', checked)}
      />
      <Radio label="Send notifications" helperText="Toggle as needed" />
    </View>
  ),
}

// Controlled radio example
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <Radio
        checked={checked}
        onChange={setChecked}
        label={`Radio is ${checked ? 'selected' : 'not selected'}`}
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
        <Radio size="sm" checked label="Small radio" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Medium</Text>
        <Radio size="md" checked label="Medium radio" />
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
        <Radio color="primary" checked label="Primary color" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Gray</Text>
        <Radio color="gray" checked label="Gray color" />
      </View>
    </View>
  ),
}

// All states
export const States: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Unchecked States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Radio label="Default state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Radio disabled label="Disabled state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Error</Text>
        <Radio error label="Error state" />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>Checked States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Radio checked label="Checked state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Radio checked disabled label="Checked disabled" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Error</Text>
        <Radio checked error label="Checked error" />
      </View>
    </View>
  ),
}

// Without label
export const WithoutLabel: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Unchecked</Text>
        <Radio />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Checked</Text>
        <Radio checked />
      </View>
    </View>
  ),
}

// Helper text examples
export const WithHelperText: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Radio label="Accept terms" helperText="Please read our terms and conditions carefully" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Optional</Text>
        <Radio
          label="Email notifications"
          optional
          helperText="We'll send you updates about your account"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Checked</Text>
        <Radio
          checked
          label="Subscribe to newsletter"
          helperText="Get weekly updates delivered to your inbox"
        />
      </View>
    </View>
  ),
}

// Radio group vertical
export const RadioGroupVertical: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('1')

    return (
      <RadioGroup
        value={value}
        onChange={setValue}
        label="Choose an option"
        options={[
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3' },
          { label: 'Option 4', value: '4', disabled: true },
          { label: 'Option 5', value: '5' },
        ]}
      />
    )
  },
}

// Radio group horizontal
export const RadioGroupHorizontal: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('2')

    return (
      <RadioGroup
        value={value}
        onChange={setValue}
        label="Choose an option"
        orientation="horizontal"
        options={[
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3' },
        ]}
      />
    )
  },
}

// Radio group with helper text
export const RadioGroupWithHelperText: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('')

    return (
      <RadioGroup
        value={value}
        onChange={setValue}
        label="Notification preferences"
        options={[
          {
            label: 'All notifications',
            value: 'all',
            helperText: 'Receive all updates and alerts',
          },
          {
            label: 'Important only',
            value: 'important',
            helperText: 'Only critical notifications',
          },
          {
            label: 'None',
            value: 'none',
            helperText: 'Disable all notifications',
          },
        ]}
      />
    )
  },
}

// Playground example matching Figma design
export const Playground: Story = {
  render: () => (
    <View style={styles.playgroundContainer}>
      {/* Light theme */}
      <View style={styles.playgroundColumn}>
        <Text style={styles.playgroundTitle}>Light Theme</Text>
        <View style={styles.playgroundExamples}>
          {/* Checked with label */}
          <Radio checked label="Subscribe to Newsletter" />

          {/* Unchecked with label and helper text */}
          <Radio
            label="Complete Tasks"
            helperText="Mark this checkbox when you've finished the assigned task."
          />

          {/* Focused state */}
          <Radio label="Share Location" helperText="Helper text" />

          {/* With optional indicator and helper text */}
          <Radio label="Email Notifications" optional helperText="We will not spam you, promise!" />

          {/* Simple label */}
          <Radio label="Dark Mode" />
        </View>
      </View>

      {/* Dark theme */}
      <View style={[styles.playgroundColumn, styles.darkBackground]}>
        <Text style={[styles.playgroundTitle, styles.darkText]}>Dark Theme</Text>
        <View style={styles.playgroundExamples}>
          {/* Checked with label */}
          <Radio checked label="Subscribe to Newsletter" />

          {/* Unchecked with label and helper text */}
          <Radio
            label="Complete Tasks"
            helperText="Mark this checkbox when you've finished the assigned task."
          />

          {/* Focused state */}
          <Radio label="Share Location" helperText="Helper text" />

          {/* With optional indicator and helper text */}
          <Radio label="Email Notifications" optional helperText="We will not spam you, promise!" />

          {/* Simple label */}
          <Radio label="Dark Mode" />
        </View>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  playgroundContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    minWidth: 800,
  },
  playgroundColumn: {
    flex: 1,
    padding: spacing[80],
    paddingHorizontal: spacing[128],
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
  playgroundExamples: {
    gap: spacing[40],
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
})
