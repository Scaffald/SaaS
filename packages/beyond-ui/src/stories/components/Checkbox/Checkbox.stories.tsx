/**
 * Checkbox component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Checkbox } from '../../../components/Checkbox'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

// Basic checkbox
export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
}

// Controlled checkbox example
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <Checkbox
        checked={checked}
        onChange={setChecked}
        label={`Checkbox is ${checked ? 'checked' : 'unchecked'}`}
      />
    )
  },
}

// Indeterminate state
export const Indeterminate: Story = {
  render: () => {
    const [items, setItems] = useState([false, false, false])

    const someChecked = items.some((item) => item) && !items.every((item) => item)
    const isAllChecked = items.every((item) => item)

    const handleSelectAll = () => {
      const newValue = !isAllChecked
      setItems(items.map(() => newValue))
    }

    const handleItemChange = (index: number) => {
      const newItems = [...items]
      newItems[index] = !newItems[index]
      setItems(newItems)
    }

    return (
      <View style={styles.indeterminateContainer}>
        <Checkbox
          checked={isAllChecked}
          indeterminate={someChecked}
          onChange={handleSelectAll}
          label="Select all"
        />
        <View style={styles.indeterminateList}>
          {items.map((checked, index) => (
            <Checkbox
              key={`item-${index}`}
              checked={checked}
              onChange={() => handleItemChange(index)}
              label={`Item ${index + 1}`}
            />
          ))}
        </View>
      </View>
    )
  },
}

// All sizes
export const Sizes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Small</Text>
        <Checkbox size="sm" label="Small checkbox" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Medium</Text>
        <Checkbox size="md" label="Medium checkbox" />
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
        <Checkbox color="primary" checked label="Primary color" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Gray</Text>
        <Checkbox color="gray" checked label="Gray color" />
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
        <Checkbox label="Default state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Checkbox disabled label="Disabled state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Error</Text>
        <Checkbox error label="Error state" />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>Checked States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Checkbox checked label="Checked state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Checkbox checked disabled label="Checked disabled" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Error</Text>
        <Checkbox checked error label="Checked error" />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[16] }]}>Indeterminate States</Text>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Default</Text>
        <Checkbox indeterminate label="Indeterminate state" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Checkbox indeterminate disabled label="Indeterminate disabled" />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Error</Text>
        <Checkbox indeterminate error label="Indeterminate error" />
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
        <Checkbox />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Checked</Text>
        <Checkbox checked />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Indeterminate</Text>
        <Checkbox indeterminate />
      </View>
    </View>
  ),
}

// Form example
export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      newsletter: false,
      terms: false,
      privacy: false,
    })

    const allAccepted = formData.terms && formData.privacy

    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Sign up form</Text>
        <Checkbox
          checked={formData.newsletter}
          onChange={(checked) => setFormData({ ...formData, newsletter: checked })}
          label="Subscribe to newsletter"
        />
        <Checkbox
          checked={formData.terms}
          onChange={(checked) => setFormData({ ...formData, terms: checked })}
          label="I accept the terms and conditions"
          error={!formData.terms}
        />
        <Checkbox
          checked={formData.privacy}
          onChange={(checked) => setFormData({ ...formData, privacy: checked })}
          label="I accept the privacy policy"
          error={!formData.privacy}
        />
        <View style={styles.formResult}>
          <Text style={styles.formResultText}>Form is {allAccepted ? 'valid ✓' : 'invalid ✗'}</Text>
        </View>
      </View>
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
          {/* Small checked checkbox */}
          <Checkbox size="sm" checked label="Subscribe to Newsletter" />

          {/* Medium indeterminate with helper text */}
          <Checkbox
            size="md"
            color="primary"
            indeterminate
            label="Complete Tasks"
            helperText="Mark this checkbox when you've finished the assigned task."
          />

          {/* Medium focused */}
          <Checkbox size="md" label="Share Location" />

          {/* Small with optional indicator and helper text */}
          <Checkbox
            size="sm"
            label="Email Notifications"
            optional
            helperText="We will not spam you, promise!"
          />

          {/* Small disabled checked */}
          <Checkbox size="sm" checked disabled label="Label" />
        </View>
      </View>

      {/* Dark theme - wrapped in dark theme provider would be ideal */}
      <View style={[styles.playgroundColumn, styles.darkBackground]}>
        <Text style={[styles.playgroundTitle, styles.darkText]}>Dark Theme</Text>
        <View style={styles.playgroundExamples}>
          {/* Small checked checkbox */}
          <Checkbox size="sm" checked label="Subscribe to Newsletter" />

          {/* Medium indeterminate with helper text */}
          <Checkbox
            size="md"
            color="primary"
            indeterminate
            label="Complete Tasks"
            helperText="Mark this checkbox when you've finished the assigned task."
          />

          {/* Medium focused */}
          <Checkbox size="md" label="Share Location" />

          {/* Small with optional indicator and helper text */}
          <Checkbox
            size="sm"
            label="Email Notifications"
            optional
            helperText="We will not spam you, promise!"
          />

          {/* Small disabled checked */}
          <Checkbox size="sm" checked disabled label="Label" />
        </View>
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
        <Checkbox
          label="Accept terms"
          helperText="Please read our terms and conditions carefully"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Optional</Text>
        <Checkbox
          label="Email notifications"
          optional
          helperText="We'll send you updates about your account"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Checked</Text>
        <Checkbox
          checked
          label="Subscribe to newsletter"
          helperText="Get weekly updates delivered to your inbox"
        />
      </View>
      <View style={styles.variantRow}>
        <Text style={styles.variantLabel}>Disabled</Text>
        <Checkbox
          disabled
          label="Required field"
          helperText="This option is managed by your administrator"
        />
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
  indeterminateContainer: {
    gap: spacing[12],
    minWidth: 300,
  },
  indeterminateList: {
    marginLeft: spacing[24],
    gap: spacing[8],
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
  formResult: {
    marginTop: spacing[16],
    padding: spacing[12],
    backgroundColor: colors.gray[50],
    borderRadius: 4,
  },
  formResultText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.primary,
    textAlign: 'center',
  },
})
