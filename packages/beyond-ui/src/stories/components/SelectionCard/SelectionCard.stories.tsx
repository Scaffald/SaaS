/**
 * SelectionCard component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SelectionCard } from '../../../components/SelectionCard'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/SelectionCard',
  component: SelectionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SelectionCard>

export default meta
type Story = StoryObj<typeof meta>

// Simple icon component for demos
function TruckIcon({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 4,
      }}
    />
  )
}

// Basic selection card
export const Default: Story = {
  args: {
    title: 'Express Shipping',
    description: 'Fast shipping for additional $29',
    icon: TruckIcon,
  },
}

// Controlled selection card example
export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = useState(false)

    return (
      <View style={styles.container}>
        <SelectionCard
          title="Express Shipping"
          description="Fast shipping for additional $29"
          selected={selected}
          onChange={setSelected}
          icon={TruckIcon}
        />
        <Text style={styles.status}>Selected: {selected ? 'Yes' : 'No'}</Text>
      </View>
    )
  },
}

// Uncontrolled mode - component manages its own state
export const Uncontrolled: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Click to toggle (no state management needed)</Text>
      <SelectionCard
        type="checkbox"
        title="Express Shipping"
        description="Click to select/deselect"
        icon={TruckIcon}
      />
      <SelectionCard
        type="radio"
        title="Standard Shipping"
        description="Click to select"
        icon={TruckIcon}
      />
      <SelectionCard
        type="toggle"
        title="Enable Notifications"
        description="Click to toggle on/off"
        icon={TruckIcon}
      />
    </View>
  ),
}

// All states for Checkbox type
export const CheckboxStates: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Checkbox Card States</Text>

      <SelectionCard
        type="checkbox"
        title="Default State"
        description="Not selected, not hovered"
        icon={TruckIcon}
      />

      <SelectionCard
        type="checkbox"
        title="Selected State"
        description="Card is selected"
        selected={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="checkbox"
        title="Disabled State"
        description="Card is disabled"
        disabled={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="checkbox"
        title="Disabled + Selected"
        description="Card is disabled and selected"
        disabled={true}
        selected={true}
        icon={TruckIcon}
      />
    </View>
  ),
}

// All states for Radio type
export const RadioStates: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Radio Card States</Text>

      <SelectionCard
        type="radio"
        title="Default State"
        description="Not selected, not hovered"
        icon={TruckIcon}
      />

      <SelectionCard
        type="radio"
        title="Selected State"
        description="Card is selected"
        selected={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="radio"
        title="Disabled State"
        description="Card is disabled"
        disabled={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="radio"
        title="Disabled + Selected"
        description="Card is disabled and selected"
        disabled={true}
        selected={true}
        icon={TruckIcon}
      />
    </View>
  ),
}

// All states for Toggle type
export const ToggleStates: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Toggle Card States</Text>

      <SelectionCard
        type="toggle"
        title="Default State (Off)"
        description="Toggle is off"
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Selected State (On)"
        description="Toggle is on"
        selected={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Disabled State (Off)"
        description="Card is disabled"
        disabled={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Disabled + On"
        description="Card is disabled and on"
        disabled={true}
        selected={true}
        icon={TruckIcon}
      />
    </View>
  ),
}

// All three types side by side
export const AllTypes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Selection Types Comparison</Text>

      <SelectionCard
        type="checkbox"
        title="Checkbox Card"
        description="Multiple selection allowed"
        icon={TruckIcon}
      />

      <SelectionCard
        type="radio"
        title="Radio Card"
        description="Single selection only"
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Toggle Card"
        description="On/off state"
        icon={TruckIcon}
      />
    </View>
  ),
}

// Without description
export const WithoutDescription: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Cards Without Description</Text>

      <SelectionCard
        type="checkbox"
        title="Express Shipping"
        showDescription={false}
        icon={TruckIcon}
      />

      <SelectionCard
        type="radio"
        title="Standard Shipping"
        showDescription={false}
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Enable Notifications"
        showDescription={false}
        icon={TruckIcon}
      />
    </View>
  ),
}

// Interactive group example
export const ShippingOptions: Story = {
  render: () => {
    const [selectedShipping, setSelectedShipping] = useState<string>('standard')

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Select Shipping Method</Text>

        <SelectionCard
          type="radio"
          title="Standard Shipping"
          description="Delivery in 5-7 business days"
          selected={selectedShipping === 'standard'}
          onChange={() => setSelectedShipping('standard')}
          icon={TruckIcon}
        />

        <SelectionCard
          type="radio"
          title="Express Shipping"
          description="Fast shipping for additional $29"
          selected={selectedShipping === 'express'}
          onChange={() => setSelectedShipping('express')}
          icon={TruckIcon}
        />

        <SelectionCard
          type="radio"
          title="Overnight Shipping"
          description="Next day delivery for $49"
          selected={selectedShipping === 'overnight'}
          onChange={() => setSelectedShipping('overnight')}
          icon={TruckIcon}
        />

        <Text style={styles.status}>Selected: {selectedShipping}</Text>
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
          <SelectionCard
            type="checkbox"
            title="Express Shipping"
            description="Fast shipping for additional $29"
            icon={TruckIcon}
          />

          <SelectionCard
            type="checkbox"
            title="Express Shipping"
            description="Fast shipping for additional $29"
            selected={true}
            icon={TruckIcon}
          />

          <SelectionCard
            type="radio"
            title="Standard Shipping"
            description="Delivery in 5-7 business days"
            icon={TruckIcon}
          />

          <SelectionCard
            type="toggle"
            title="Enable Notifications"
            description="Get updates about your order"
            icon={TruckIcon}
          />
        </View>
      )}
    </ThemeComparison>
  ),
}

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Size Variants</Text>

      <SelectionCard
        type="checkbox"
        title="Small Size"
        description="Card with small controls"
        size="sm"
        icon={TruckIcon}
      />

      <SelectionCard
        type="checkbox"
        title="Medium Size (Default)"
        description="Card with medium controls"
        size="md"
        icon={TruckIcon}
      />
    </View>
  ),
}

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Color Variants</Text>

      <SelectionCard
        type="checkbox"
        title="Gray Color"
        description="Gray variant"
        color="gray"
        selected={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="checkbox"
        title="Primary Color (Default)"
        description="Primary brand color"
        color="primary"
        selected={true}
        icon={TruckIcon}
      />

      <SelectionCard
        type="toggle"
        title="Red-Green Toggle"
        description="For on/off states"
        color="red-green"
        selected={true}
        icon={TruckIcon}
      />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    width: 400,
  },
  variantsContainer: {
    gap: spacing[16],
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
  status: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.text.light.secondary,
    marginTop: spacing[8],
  },
})
