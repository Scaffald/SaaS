/**
 * Button Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../../../components/Button'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component with multiple variants, sizes, and states.',
      },
    },
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['gray', 'primary', 'error'],
      description: 'Button color variant',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outline', 'light', 'text'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
    children: {
      control: 'text',
      description: 'Button text content',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Button',
    color: 'primary',
    variant: 'filled',
    size: 'md',
  },
}

export const Variants: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button variant="filled" color="primary">
          Filled Primary
        </Button>
        <Button variant="outline" color="primary">
          Outline Primary
        </Button>
        <Button variant="light" color="primary">
          Light Primary
        </Button>
        <Button variant="text" color="primary">
          Text Primary
        </Button>
      </View>
      <View style={styles.row}>
        <Button variant="filled" color="gray">
          Filled Gray
        </Button>
        <Button variant="outline" color="gray">
          Outline Gray
        </Button>
        <Button variant="light" color="gray">
          Light Gray
        </Button>
        <Button variant="text" color="gray">
          Text Gray
        </Button>
      </View>
      <View style={styles.row}>
        <Button variant="filled" color="error">
          Filled Error
        </Button>
        <Button variant="outline" color="error">
          Outline Error
        </Button>
        <Button variant="light" color="error">
          Light Error
        </Button>
        <Button variant="text" color="error">
          Text Error
        </Button>
      </View>
    </View>
  ),
}

export const Sizes: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </View>
    </View>
  ),
}

export const States: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </View>
    </View>
  ),
}

export const FullWidth: Story = {
  render: () => (
    <View style={styles.fullWidthContainer}>
      <Button fullWidth>Full Width Button</Button>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[8],
    flexWrap: 'wrap',
  },
  fullWidthContainer: {
    width: 400,
    padding: spacing[16],
  },
})
