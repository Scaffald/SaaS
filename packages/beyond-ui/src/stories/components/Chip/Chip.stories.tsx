/**
 * Chip component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Chip } from '../../../components/Chip'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

// Simple icon component for demos
function FilterIcon({ size, color }: { size: number; color: string }) {
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

// Basic chip
export const Default: Story = {
  args: {
    children: 'Chip',
  },
}

// Controlled chip example
export const Controlled: Story = {
  render: () => {
    const [selected, setSelected] = useState(false)

    return (
      <View style={styles.container}>
        <Chip selected={selected} onPress={() => setSelected(!selected)}>
          {selected ? 'Selected' : 'Not Selected'}
        </Chip>
        <Text style={styles.status}>Selected: {selected ? 'Yes' : 'No'}</Text>
      </View>
    )
  },
}

// Uncontrolled mode
export const Uncontrolled: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Click to toggle (no state management needed)</Text>
      <Chip>Chip 1</Chip>
      <Chip>Chip 2</Chip>
      <Chip>Chip 3</Chip>
    </View>
  ),
}

// All sizes
export const Sizes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Chip Sizes</Text>
      <Chip size="sm">Small Chip</Chip>
      <Chip size="md">Medium Chip</Chip>
      <Chip size="lg">Large Chip</Chip>
    </View>
  ),
}

// All states
export const States: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Chip States</Text>

      <Chip>Default State</Chip>

      <Chip selected={true}>Selected State</Chip>

      <Chip disabled={true}>Disabled State</Chip>

      <Chip disabled={true} selected={true}>
        Disabled + Selected
      </Chip>
    </View>
  ),
}

// All types
export const Types: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Chip Types</Text>

      <Chip type="default">Default</Chip>

      <Chip type="icon" icon={FilterIcon}>
        With Icon
      </Chip>

      <Chip
        type="avatar"
        avatar={
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.primary[500],
            }}
          />
        }
      >
        With Avatar
      </Chip>

      <Chip
        type="flag"
        flag={
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: colors.error[500],
              borderRadius: 2,
            }}
          />
        }
      >
        With Flag
      </Chip>

      <Chip
        type="brand-icon"
        brandIcon={
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: colors.gray[400],
              borderRadius: 4,
            }}
          />
        }
      >
        With Brand Icon
      </Chip>

      <Chip
        type="crypto"
        crypto={
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: colors.warning[500],
              borderRadius: 4,
            }}
          />
        }
      >
        With Crypto
      </Chip>
    </View>
  ),
}

// With close icon
export const WithCloseIcon: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Chips with Close Icon</Text>

      <Chip closeIcon onClose={() => console.log('Closed')}>
        Dismissible Chip
      </Chip>

      <Chip closeIcon selected onClose={() => console.log('Closed')}>
        Selected + Dismissible
      </Chip>

      <Chip closeIcon disabled onClose={() => console.log('Closed')}>
        Disabled + Dismissible
      </Chip>

      <Chip type="icon" icon={FilterIcon} closeIcon onClose={() => console.log('Closed')}>
        With Icon + Close
      </Chip>
    </View>
  ),
}

// Selected variants
export const SelectedVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Selected Chips</Text>

      <Chip selected>Default Selected</Chip>

      <Chip type="icon" icon={FilterIcon} selected>
        Icon Selected
      </Chip>

      <Chip
        type="avatar"
        avatar={
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.primary[500],
            }}
          />
        }
        selected
      >
        Avatar Selected
      </Chip>

      <Chip closeIcon selected onClose={() => console.log('Closed')}>
        Selected + Close
      </Chip>
    </View>
  ),
}

// Interactive filter example
export const FilterChips: Story = {
  render: () => {
    const [selectedFilters, setSelectedFilters] = useState<string[]>(['design'])

    const filters = ['design', 'development', 'marketing', 'sales', 'support']

    const toggleFilter = (filter: string) => {
      setSelectedFilters((prev) =>
        prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
      )
    }

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Filter by Category</Text>
        <View style={styles.variantsContainer}>
          {filters.map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilters.includes(filter)}
              onPress={() => toggleFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Chip>
          ))}
        </View>
        <Text style={styles.status}>Selected: {selectedFilters.join(', ')}</Text>
      </View>
    )
  },
}

// Dismissible tags example
export const DismissibleTags: Story = {
  render: () => {
    const [tags, setTags] = useState(['React', 'TypeScript', 'Storybook', 'Design Systems'])

    const removeTag = (tagToRemove: string) => {
      setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
    }

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Skills (click X to remove)</Text>
        <View style={styles.variantsContainer}>
          {tags.map((tag) => (
            <Chip key={tag} closeIcon onClose={() => removeTag(tag)}>
              {tag}
            </Chip>
          ))}
        </View>
        <Text style={styles.status}>Remaining: {tags.length} tags</Text>
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
          <Chip>Default Chip</Chip>

          <Chip selected>Selected Chip</Chip>

          <Chip type="icon" icon={FilterIcon}>
            Icon Chip
          </Chip>

          <Chip closeIcon onClose={() => console.log('Closed')}>
            Dismissible Chip
          </Chip>

          <Chip disabled>Disabled Chip</Chip>
        </View>
      )}
    </ThemeComparison>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    width: 400,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
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
