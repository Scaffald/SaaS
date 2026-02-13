/**
 * DatePickerHeader Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { DatePickerHeader } from '../../../components/DatePickerHeader'

const meta: Meta<typeof DatePickerHeader> = {
  title: 'Components/DatePickerHeader',
  component: DatePickerHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Header for date picker with month/year display and navigation arrows.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DatePickerHeader>

export const Default: Story = {
  render: () => {
    const today = new Date()
    return (
      <DatePickerHeader
        month={today.getMonth()}
        year={today.getFullYear()}
        onPreviousMonth={() => console.log('Previous month')}
        onNextMonth={() => console.log('Next month')}
      />
    )
  },
}

export const CenterPosition: Story = {
  render: () => {
    const today = new Date()
    return (
      <DatePickerHeader
        month={today.getMonth()}
        year={today.getFullYear()}
        position="center"
        onPreviousMonth={() => console.log('Previous month')}
        onNextMonth={() => console.log('Next month')}
      />
    )
  },
}

export const DropdownVariant: Story = {
  render: () => {
    const today = new Date()
    return (
      <DatePickerHeader
        month={today.getMonth()}
        year={today.getFullYear()}
        type="dropdown"
        position="center"
      />
    )
  },
}

export const Disabled: Story = {
  render: () => {
    const today = new Date()
    return (
      <DatePickerHeader
        month={today.getMonth()}
        year={today.getFullYear()}
        disabled
        onPreviousMonth={() => console.log('Previous month')}
        onNextMonth={() => console.log('Next month')}
      />
    )
  },
}

export const DifferentMonth: Story = {
  render: () => {
    const today = new Date()
    return (
      <DatePickerHeader
        month={11}
        year={today.getFullYear() + 1}
        onPreviousMonth={() => console.log('Previous month')}
        onNextMonth={() => console.log('Next month')}
      />
    )
  },
}
