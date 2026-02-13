/**
 * DatePicker Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePicker } from '../../../components/DatePicker'
import type { DatePickerPresetOption } from '../../../components/DatePicker'
import { dateToSimple, type DateObject } from '../../../components/DatePickerBase/DatePickerBase.utils'

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Main date picker component with variants (blank, one-day-selected, date-range) and sizes (small, expanded).',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['blank', 'one-day-selected', 'date-range'],
      description: 'Date picker type variant',
    },
    size: {
      control: 'select',
      options: ['small', 'expanded'],
      description: 'Date picker size variant',
    },
  },
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Blank: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<DateObject | null>(null)

    return (
      <DatePicker
        type="blank"
        size="small"
        value={selectedDate}
        onChange={(date) => {
          if (date && !Array.isArray(date)) {
            setSelectedDate(date)
          }
        }}
      />
    )
  },
}

export const OneDaySelected: Story = {
  render: () => {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState<DateObject>(
      dateToSimple(new Date(today.getFullYear(), today.getMonth(), 16))
    )

    return (
      <DatePicker
        type="one-day-selected"
        size="small"
        value={selectedDate}
        onChange={(date) => {
          if (date && !Array.isArray(date)) {
            setSelectedDate(date)
          }
        }}
      />
    )
  },
}

export const DateRange: Story = {
  render: () => {
    const today = new Date()
    const [dateRange, setDateRange] = useState<[DateObject, DateObject]>([
      dateToSimple(new Date(today.getFullYear(), today.getMonth(), 12)),
      dateToSimple(new Date(today.getFullYear(), today.getMonth(), 16)),
    ])

    return (
      <DatePicker
        type="date-range"
        size="small"
        value={dateRange}
        onChange={(range) => {
          if (range && Array.isArray(range)) {
            setDateRange(range)
          }
        }}
      />
    )
  },
}

export const WithActions: Story = {
  render: () => {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      new Date(today.getFullYear(), today.getMonth(), 16)
    )

    return (
      <DatePicker
        type="one-day-selected"
        size="small"
        value={selectedDate}
        onChange={(date) => {
          if (date && !Array.isArray(date)) {
            setSelectedDate(date)
          }
        }}
        onCancel={() => console.log('Canceled')}
        onApply={() => console.log('Applied:', selectedDate)}
      />
    )
  },
}

export const Expanded: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const presetOptions: DatePickerPresetOption[] = [
      {
        label: 'Custom Date Range',
        onSelect: () => console.log('Custom range'),
      },
      {
        label: 'Today',
        onSelect: () => setSelectedDate(new Date()),
      },
      {
        label: 'Last 7 Days',
        onSelect: () => {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 6)
          setSelectedDate([start, end] as [Date, Date])
        },
      },
      {
        label: 'This Month',
        onSelect: () => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), 1)
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          setSelectedDate([start, end] as [Date, Date])
        },
      },
      {
        label: 'Last 3 Months',
        onSelect: () => {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          setSelectedDate([start, end] as [Date, Date])
        },
      },
      {
        label: 'This Year',
        onSelect: () => {
          const now = new Date()
          const start = new Date(now.getFullYear(), 0, 1)
          const end = new Date(now.getFullYear(), 11, 31)
          setSelectedDate([start, end] as [Date, Date])
        },
      },
      {
        label: 'All Time',
        onSelect: () => {
          const start = new Date(2000, 0, 1)
          const end = new Date(2100, 11, 31)
          setSelectedDate([start, end] as [Date, Date])
        },
      },
    ]

    return (
      <DatePicker
        type="date-range"
        size="expanded"
        value={selectedDate}
        onChange={(date) => {
          if (date && (Array.isArray(date) || date instanceof Date)) {
            setSelectedDate(date as [Date, Date] | Date | null)
          }
        }}
        presetOptions={presetOptions}
        onCancel={() => console.log('Canceled')}
        onApply={() => console.log('Applied:', selectedDate)}
      />
    )
  },
}

export const ExpandedWithSelectedRange: Story = {
  render: () => {
    const today = new Date()
    const [dateRange, setDateRange] = useState<[Date, Date] | null>([
      new Date(today.getFullYear(), today.getMonth(), 12),
      new Date(today.getFullYear(), today.getMonth(), 16),
    ])

    const presetOptions: DatePickerPresetOption[] = [
      {
        label: 'Today',
        onSelect: () => {
          const today = new Date()
          setDateRange([today, today])
        },
      },
      {
        label: 'Last 7 Days',
        onSelect: () => {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 6)
          setDateRange([start, end])
        },
      },
    ]

    return (
      <DatePicker
        type="date-range"
        size="expanded"
        value={dateRange}
        onChange={(range) => setDateRange(range as [Date, Date])}
        presetOptions={presetOptions}
        onCancel={() => console.log('Canceled')}
        onApply={() => console.log('Applied:', dateRange)}
      />
    )
  },
}

export const WithIndicators: Story = {
  render: () => {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const indicatorDays = [
      new Date(today.getFullYear(), today.getMonth(), 7),
      new Date(today.getFullYear(), today.getMonth(), 11),
      new Date(today.getFullYear(), today.getMonth(), 16),
    ]

    return (
      <DatePicker
        type="blank"
        size="small"
        value={selectedDate}
        onChange={(date) => {
          if (date && !Array.isArray(date)) {
            setSelectedDate(date)
          }
        }}
        showIndicators
        indicatorDays={indicatorDays}
      />
    )
  },
}

export const WithMinMaxDates: Story = {
  render: () => {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const minDate = new Date(today.getFullYear(), today.getMonth(), 5)
    const maxDate = new Date(today.getFullYear(), today.getMonth(), 25)

    return (
      <DatePicker
        type="blank"
        size="small"
        value={selectedDate}
        onChange={(date) => {
          if (date && !Array.isArray(date)) {
            setSelectedDate(date)
          }
        }}
        minDate={minDate}
        maxDate={maxDate}
      />
    )
  },
}

