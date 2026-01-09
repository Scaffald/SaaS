/**
 * Stepper component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { Stepper, Breadcrumb } from '../../../components/Stepper'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Stepper>

export default meta
type Story = StoryObj<typeof meta>

// Sample step data
const checkoutSteps = [
  { label: 'Cart Review' },
  { label: 'Shipping Details' },
  { label: 'Payment Information' },
  { label: 'Order Summary' },
  { label: 'Review and Confirm' },
  { label: 'Order Confirmation' },
]

const checkoutStepsWithDescription = [
  { label: 'Cart Review', description: 'Review your items' },
  { label: 'Shipping Details', description: 'Enter shipping info' },
  { label: 'Payment Information', description: 'Payment method' },
  { label: 'Order Summary', description: 'Review order' },
  { label: 'Review and Confirm', description: 'Final confirmation' },
  { label: 'Order Confirmation', description: 'Order placed' },
]

// Basic stepper
export const Default: Story = {
  render: () => (
    <View style={styles.container}>
      <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={1} />
    </View>
  ),
}

// With descriptions
export const WithDescriptions: Story = {
  render: () => (
    <View style={styles.container}>
      <Stepper steps={checkoutStepsWithDescription.slice(0, 4)} currentStep={1} showDescription />
    </View>
  ),
}

// Different step counts
export const StepCounts: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>2 Steps</Text>
      <Stepper steps={checkoutSteps.slice(0, 2)} currentStep={0} />
      <Text style={styles.sectionTitle}>3 Steps</Text>
      <Stepper steps={checkoutSteps.slice(0, 3)} currentStep={1} />
      <Text style={styles.sectionTitle}>4 Steps</Text>
      <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={2} />
      <Text style={styles.sectionTitle}>5 Steps</Text>
      <Stepper steps={checkoutSteps.slice(0, 5)} currentStep={3} />
      <Text style={styles.sectionTitle}>6 Steps</Text>
      <Stepper steps={checkoutSteps} currentStep={4} />
    </View>
  ),
}

// All step states
export const StepStates: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Step States</Text>
      <Stepper
        steps={[
          { label: 'Completed Step' },
          { label: 'Current Step' },
          { label: 'Next Step' },
          { label: 'Future Step' },
        ]}
        currentStep={1}
      />
    </View>
  ),
}

// Interactive stepper (clickable navigation)
export const Interactive: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(1)

    return (
      <View style={styles.container}>
        <Stepper
          steps={checkoutSteps.slice(0, 4)}
          currentStep={currentStep}
          showDescription
          interactive
          onStepPress={(index) => setCurrentStep(index)}
        />
        <View style={styles.controls}>
          <Text style={styles.status}>Current Step: {currentStep + 1}</Text>
          <Text style={styles.hint}>Click any step to navigate</Text>
        </View>
      </View>
    )
  },
}

// Non-interactive (informational only)
export const NonInteractive: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informational Stepper (not clickable)</Text>
      <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={2} showDescription interactive={false} />
    </View>
  ),
}

// Responsive wrapping
export const ResponsiveWrapping: Story = {
  render: () => (
    <View style={styles.responsiveContainer}>
      <Text style={styles.sectionTitle}>Responsive Wrapping</Text>
      <Text style={styles.hint}>
        Resize the viewport to see steps wrap with proper vertical spacing
      </Text>
      <Stepper
        steps={checkoutSteps}
        currentStep={3}
        showDescription
        style={styles.responsiveStepper}
      />
    </View>
  ),
}

// Interactive with disabled steps
export const WithDisabledSteps: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(2)

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Interactive with Disabled Steps</Text>
        <Stepper
          steps={[
            { label: 'Step 1', disabled: false },
            { label: 'Step 2', disabled: false },
            { label: 'Step 3 (Disabled)', disabled: true },
            { label: 'Step 4', disabled: false },
          ]}
          currentStep={currentStep}
          interactive
          onStepPress={(index) => setCurrentStep(index)}
        />
        <View style={styles.controls}>
          <Text style={styles.status}>Current Step: {currentStep + 1}</Text>
          <Text style={styles.hint}>Step 3 is disabled and cannot be clicked</Text>
        </View>
      </View>
    )
  },
}

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Primary Color</Text>
      <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={1} color="primary" />
      <Text style={styles.sectionTitle}>Gray Color</Text>
      <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={1} color="gray" />
    </View>
  ),
}

// Theme comparison
export const ThemeVariants: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.container}>
          <Stepper steps={checkoutSteps.slice(0, 4)} currentStep={1} showDescription />
        </View>
      )}
    </ThemeComparison>
  ),
}

// Breadcrumb examples (interactive by default)
export const BreadcrumbExample: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState(3)

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Breadcrumb Navigation (Interactive)</Text>
        <Breadcrumb
          items={[
            { label: 'Home' },
            { label: 'Products' },
            { label: 'Electronics' },
            { label: 'Current Page' },
          ]}
          currentIndex={currentIndex}
          onStepPress={(index) => setCurrentIndex(index)}
        />
        <View style={styles.controls}>
          <Text style={styles.status}>Current Index: {currentIndex}</Text>
          <Text style={styles.hint}>Click breadcrumb items to navigate</Text>
        </View>
      </View>
    )
  },
}

// Non-interactive breadcrumb
export const BreadcrumbNonInteractive: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Breadcrumb (Informational Only)</Text>
      <Breadcrumb
        items={[
          { label: 'Home' },
          { label: 'Products' },
          { label: 'Electronics' },
          { label: 'Current Page' },
        ]}
        currentIndex={3}
        interactive={false}
      />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    width: 600,
  },
  variantsContainer: {
    gap: spacing[24],
    padding: spacing[16],
    width: 600,
  },
  responsiveContainer: {
    padding: spacing[16],
    width: '100%',
    maxWidth: 800,
    minWidth: 300, // Allow shrinking to test wrapping
  },
  responsiveStepper: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    lineHeight: typography.h6.lineHeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  controls: {
    marginTop: spacing[16],
    padding: spacing[16],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: 8,
    gap: spacing[8],
  },
  status: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text.light.primary,
  },
  hint: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.text.light.tertiary,
    fontStyle: 'italic',
  },
})

