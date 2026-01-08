/**
 * Pagination component stories
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import { Pagination } from '../../../components/Pagination'
import { ThemeComparison } from '../../../playground'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

// Basic default pagination
export const Default: Story = {
  args: {
    totalPages: 10,
  },
}

// Few pages (no ellipsis needed)
export const FewPages: Story = {
  args: {
    totalPages: 3,
  },
}

// Many pages with ellipsis
export const ManyPages: Story = {
  args: {
    totalPages: 50,
    defaultPage: 25,
  },
}

// Single page (navigation disabled)
export const SinglePage: Story = {
  args: {
    totalPages: 1,
  },
}

// Type Variants
export const TypeVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Type Variants</Text>

      <Text style={styles.subtitle}>Numbers (Default)</Text>
      <Pagination totalPages={10} defaultPage={5} />

      <Text style={styles.subtitle}>Label</Text>
      <Pagination totalPages={10} defaultPage={5} type="label" />
    </View>
  ),
}

// Position Variants
export const PositionVariants: Story = {
  render: () => (
    <View style={styles.fullWidthContainer}>
      <Text style={styles.sectionTitle}>Position Variants</Text>

      <Text style={styles.subtitle}>Left Aligned</Text>
      <View style={styles.fullWidth}>
        <Pagination totalPages={10} defaultPage={5} position="left" />
      </View>

      <Text style={styles.subtitle}>Center Aligned (Default)</Text>
      <View style={styles.fullWidth}>
        <Pagination totalPages={10} defaultPage={5} position="center" />
      </View>

      <Text style={styles.subtitle}>Right Aligned</Text>
      <View style={styles.fullWidth}>
        <Pagination totalPages={10} defaultPage={5} position="right" />
      </View>
    </View>
  ),
}

// Page Radius Variants
export const PageRadiusVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Page Button Radius Variants</Text>

      <Text style={styles.subtitle}>Rounded (Default)</Text>
      <Pagination totalPages={10} defaultPage={5} pageRadius="rounded" />

      <Text style={styles.subtitle}>Square</Text>
      <Pagination totalPages={10} defaultPage={5} pageRadius="square" />
    </View>
  ),
}

// Navigation Button Variants
export const NavigationVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Navigation Button Variants</Text>

      <Text style={styles.subtitle}>Icon Only (Default)</Text>
      <Pagination totalPages={10} defaultPage={5} />

      <Text style={styles.subtitle}>With Text Labels</Text>
      <Pagination totalPages={10} defaultPage={5} showNavText />

      <Text style={styles.subtitle}>With Borders</Text>
      <Pagination totalPages={10} defaultPage={5} showNavBorder />

      <Text style={styles.subtitle}>With Text and Borders</Text>
      <Pagination totalPages={10} defaultPage={5} showNavText showNavBorder />
    </View>
  ),
}

// State Variants
export const StateVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>State Variants</Text>

      <Text style={styles.subtitle}>First Page (Previous Disabled)</Text>
      <Pagination totalPages={10} defaultPage={1} />

      <Text style={styles.subtitle}>Last Page (Next Disabled)</Text>
      <Pagination totalPages={10} defaultPage={10} />

      <Text style={styles.subtitle}>Fully Disabled</Text>
      <Pagination totalPages={10} defaultPage={5} disabled />
    </View>
  ),
}

// Customization - Sibling Count
export const SiblingCountVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Sibling Count Variants</Text>

      <Text style={styles.subtitle}>siblingCount = 0 (Minimal)</Text>
      <Pagination totalPages={20} defaultPage={10} siblingCount={0} />

      <Text style={styles.subtitle}>siblingCount = 1 (Default)</Text>
      <Pagination totalPages={20} defaultPage={10} siblingCount={1} />

      <Text style={styles.subtitle}>siblingCount = 2</Text>
      <Pagination totalPages={20} defaultPage={10} siblingCount={2} />

      <Text style={styles.subtitle}>siblingCount = 3</Text>
      <Pagination totalPages={20} defaultPage={10} siblingCount={3} />
    </View>
  ),
}

// Customization - Boundary Count
export const BoundaryCountVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Boundary Count Variants</Text>

      <Text style={styles.subtitle}>boundaryCount = 0</Text>
      <Pagination totalPages={20} defaultPage={10} boundaryCount={0} />

      <Text style={styles.subtitle}>boundaryCount = 1 (Default)</Text>
      <Pagination totalPages={20} defaultPage={10} boundaryCount={1} />

      <Text style={styles.subtitle}>boundaryCount = 2</Text>
      <Pagination totalPages={20} defaultPage={10} boundaryCount={2} />
    </View>
  ),
}

// Controlled Mode
export const ControlledMode: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1)

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Controlled Pagination</Text>
        <Text style={styles.subtitle}>Current Page: {currentPage}</Text>

        <Pagination totalPages={10} currentPage={currentPage} onPageChange={setCurrentPage} />
      </View>
    )
  },
}

// Interactive Demo with Content
export const InteractiveDemo: Story = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = 8

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Interactive Pagination Demo</Text>

        {/* Mock content area */}
        <View style={styles.contentArea}>
          <Text style={styles.contentTitle}>Page {currentPage} Content</Text>
          <Text style={styles.contentText}>
            This is the content for page {currentPage} of {totalPages}.
          </Text>
          <Text style={styles.contentText}>
            Use the pagination controls below to navigate between pages.
          </Text>
        </View>

        {/* Pagination */}
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </View>
    )
  },
}

// All Combinations Showcase
export const AllCombinations: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Combinations Showcase</Text>

      <Text style={styles.subtitle}>Numbers + Rounded + Nav Text + Borders</Text>
      <Pagination
        totalPages={15}
        defaultPage={8}
        type="numbers"
        pageRadius="rounded"
        showNavText
        showNavBorder
      />

      <Text style={styles.subtitle}>Numbers + Square + Icon Only</Text>
      <Pagination totalPages={15} defaultPage={8} type="numbers" pageRadius="square" />

      <Text style={styles.subtitle}>Label + Nav Text + Borders</Text>
      <Pagination
        totalPages={15}
        defaultPage={8}
        type="label"
        showNavText
        showNavBorder
        pageRadius="rounded"
      />

      <Text style={styles.subtitle}>Label + Icon Only</Text>
      <Pagination totalPages={15} defaultPage={8} type="label" />
    </View>
  ),
}

// Edge Cases
export const EdgeCases: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Edge Cases</Text>

      <Text style={styles.subtitle}>1 Page Total</Text>
      <Pagination totalPages={1} />

      <Text style={styles.subtitle}>2 Pages Total</Text>
      <Pagination totalPages={2} defaultPage={1} />

      <Text style={styles.subtitle}>5 Pages (Ellipsis Edge Case)</Text>
      <Pagination totalPages={5} defaultPage={3} />

      <Text style={styles.subtitle}>7 Pages (Ellipsis Edge Case)</Text>
      <Pagination totalPages={7} defaultPage={4} />

      <Text style={styles.subtitle}>100 Pages (Many Pages)</Text>
      <Pagination totalPages={100} defaultPage={50} />
    </View>
  ),
}

// Theme Comparison
export const ThemeComparison_: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.themeContainer}>
          <Text style={styles.subtitle}>Numbers Type</Text>
          <Pagination totalPages={10} defaultPage={5} />

          <Text style={styles.subtitle}>Label Type</Text>
          <Pagination totalPages={10} defaultPage={5} type="label" showNavText showNavBorder />

          <Text style={styles.subtitle}>Square Buttons</Text>
          <Pagination totalPages={10} defaultPage={5} pageRadius="square" />

          <Text style={styles.subtitle}>Disabled State</Text>
          <Pagination totalPages={10} defaultPage={5} disabled />
        </View>
      )}
    </ThemeComparison>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    minWidth: 600,
  },
  fullWidthContainer: {
    gap: spacing[16],
    padding: spacing[16],
    width: 800,
  },
  fullWidth: {
    width: '100%',
  },
  themeContainer: {
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
  contentArea: {
    padding: spacing[20],
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: spacing[8],
    marginBottom: spacing[16],
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#141c25',
  },
  contentText: {
    fontSize: 14,
    color: '#637083',
    lineHeight: 20,
  },
})
