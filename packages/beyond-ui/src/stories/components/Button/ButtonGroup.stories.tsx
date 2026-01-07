/**
 * ButtonGroup Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { ButtonGroup } from '../../../components/ButtonGroup'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { useState } from 'react'

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'ButtonGroup component for grouped button selections (segmented control).',
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'multiple'],
      description: 'Selection mode',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
      description: 'Button size',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Button orientation',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button group',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
}

export default meta
type Story = StoryObj<typeof ButtonGroup>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('option1')
    return (
      <ButtonGroup
        items={[
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
          { id: 'option3', label: 'Option 3' },
        ]}
        value={value}
        onChange={(newValue) => setValue(newValue as string)}
      />
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [value1, setValue1] = useState('')
    const [value2, setValue2] = useState('')
    const [value3, setValue3] = useState('')
    return (
      <View style={styles.container}>
        <ButtonGroup
          items={[
            { id: '1', label: 'XS' },
            { id: '2', label: 'Size' },
            { id: '3', label: 'Buttons' },
          ]}
          size="xs"
          value={value1}
          onChange={(newValue) => setValue1(newValue as string)}
        />
        <ButtonGroup
          items={[
            { id: '1', label: 'SM' },
            { id: '2', label: 'Size' },
            { id: '3', label: 'Buttons' },
          ]}
          size="sm"
          value={value2}
          onChange={(newValue) => setValue2(newValue as string)}
        />
        <ButtonGroup
          items={[
            { id: '1', label: 'MD' },
            { id: '2', label: 'Size' },
            { id: '3', label: 'Buttons' },
          ]}
          size="md"
          value={value3}
          onChange={(newValue) => setValue3(newValue as string)}
        />
      </View>
    )
  },
}

export const MultipleSelection: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([])
    return (
      <ButtonGroup
        mode="multiple"
        items={[
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
          { id: 'option3', label: 'Option 3' },
          { id: 'option4', label: 'Option 4' },
        ]}
        value={value}
        onChange={(newValue) => setValue(newValue as string[])}
      />
    )
  },
}

export const WithDefaultValue: Story = {
  render: () => (
    <ButtonGroup
      items={[
        { id: 'day', label: 'Day' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
      ]}
      defaultValue="week"
    />
  ),
}

export const Disabled: Story = {
  render: () => (
    <View style={styles.container}>
      <ButtonGroup
        items={[
          { id: '1', label: 'Disabled' },
          { id: '2', label: 'Group' },
        ]}
        disabled
      />
      <ButtonGroup
        items={[
          { id: '1', label: 'Some' },
          { id: '2', label: 'Disabled', disabled: true },
          { id: '3', label: 'Items' },
        ]}
      />
    </View>
  ),
}

export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <View style={styles.fullWidthContainer}>
        <ButtonGroup
          items={[
            { id: '1', label: 'Full' },
            { id: '2', label: 'Width' },
            { id: '3', label: 'Button' },
            { id: '4', label: 'Group' },
          ]}
          value={value}
          onChange={(newValue) => setValue(newValue as string)}
          fullWidth
        />
      </View>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
  },
  fullWidthContainer: {
    width: 400,
    padding: spacing[16],
  },
})
