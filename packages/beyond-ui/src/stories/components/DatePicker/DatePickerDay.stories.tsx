/**
 * DatePickerDay Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { DatePickerDay } from '../../../components/DatePickerDay'

const meta: Meta<typeof DatePickerDay> = {
  title: 'Components/DatePickerDay',
  component: DatePickerDay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual day cell for date picker calendar with various states.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DatePickerDay>

export const Default: Story = {
  args: {
    day: 15,
    onPress: () => console.log('Pressed'),
  },
}

export const Selected: Story = {
  args: {
    day: 16,
    state: 'selected',
    onPress: () => console.log('Pressed'),
  },
}

export const Today: Story = {
  args: {
    day: 7,
    state: 'today',
    onPress: () => console.log('Pressed'),
  },
}

export const TodayWithIndicator: Story = {
  args: {
    day: 7,
    state: 'today',
    showIndicator: true,
    onPress: () => console.log('Pressed'),
  },
}

export const SelectedLeft: Story = {
  args: {
    day: 12,
    state: 'selected-left',
    onPress: () => console.log('Pressed'),
  },
}

export const SelectedRight: Story = {
  args: {
    day: 16,
    state: 'selected-right',
    onPress: () => console.log('Pressed'),
  },
}

export const Middle: Story = {
  args: {
    day: 13,
    state: 'middle',
    onPress: () => console.log('Pressed'),
  },
}

export const Empty: Story = {
  args: {
    day: 31,
    state: 'empty',
    disabled: true,
  },
}

export const WeekDayLabel: Story = {
  args: {
    label: 'Mo',
    disabled: true,
  },
}

export const WithIndicator: Story = {
  args: {
    day: 11,
    showIndicator: true,
    onPress: () => console.log('Pressed'),
  },
}
