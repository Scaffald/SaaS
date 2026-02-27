/**
 * DatePickerBase Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePickerBase } from '../../../components/DatePickerBase'

const meta: Meta<typeof DatePickerBase> = {
  title: 'Components/DatePickerBase',
  component: DatePickerBase,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Calendar grid component with 7-day week layout.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DatePickerBase>

export const Default: Story = {
  render: () => {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())

    return (
      <DatePickerBase
        month={month}
        year={year}
        onPreviousMonth={() => {
          const newMonth = month === 0 ? 11 : month - 1
          const newYear = month === 0 ? year - 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onNextMonth={() => {
          const newMonth = month === 11 ? 0 : month + 1
          const newYear = month === 11 ? year + 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onDateSelect={(date) => console.log('Selected:', date)}
      />
    )
  },
}

export const WithSelectedDate: Story = {
  render: () => {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      new Date(today.getFullYear(), today.getMonth(), 16)
    )

    return (
      <DatePickerBase
        month={month}
        year={year}
        selectedDate={selectedDate}
        onPreviousMonth={() => {
          const newMonth = month === 0 ? 11 : month - 1
          const newYear = month === 0 ? year - 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onNextMonth={() => {
          const newMonth = month === 11 ? 0 : month + 1
          const newYear = month === 11 ? year + 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onDateSelect={(date) => setSelectedDate(date)}
      />
    )
  },
}

export const WithDateRange: Story = {
  render: () => {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const [dateRange, setDateRange] = useState<[Date, Date] | null>([
      new Date(today.getFullYear(), today.getMonth(), 12),
      new Date(today.getFullYear(), today.getMonth(), 16),
    ])

    return (
      <DatePickerBase
        month={month}
        year={year}
        selectedDate={dateRange}
        onPreviousMonth={() => {
          const newMonth = month === 0 ? 11 : month - 1
          const newYear = month === 0 ? year - 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onNextMonth={() => {
          const newMonth = month === 11 ? 0 : month + 1
          const newYear = month === 11 ? year + 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onDateSelect={(date) => {
          if (!dateRange) {
            setDateRange([date, date])
          } else {
            const [start, end] = dateRange
            if (date < start) {
              setDateRange([date, end])
            } else {
              setDateRange([start, date])
            }
          }
        }}
      />
    )
  },
}

export const WithIndicators: Story = {
  render: () => {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const indicatorDays = [
      new Date(today.getFullYear(), today.getMonth(), 7),
      new Date(today.getFullYear(), today.getMonth(), 11),
      new Date(today.getFullYear(), today.getMonth(), 16),
    ]

    return (
      <DatePickerBase
        month={month}
        year={year}
        showIndicators
        indicatorDays={indicatorDays}
        onPreviousMonth={() => {
          const newMonth = month === 0 ? 11 : month - 1
          const newYear = month === 0 ? year - 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onNextMonth={() => {
          const newMonth = month === 11 ? 0 : month + 1
          const newYear = month === 11 ? year + 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onDateSelect={(date) => console.log('Selected:', date)}
      />
    )
  },
}

export const WithMinMaxDates: Story = {
  render: () => {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const minDate = new Date(today.getFullYear(), today.getMonth(), 5)
    const maxDate = new Date(today.getFullYear(), today.getMonth(), 25)

    return (
      <DatePickerBase
        month={month}
        year={year}
        minDate={minDate}
        maxDate={maxDate}
        onPreviousMonth={() => {
          const newMonth = month === 0 ? 11 : month - 1
          const newYear = month === 0 ? year - 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onNextMonth={() => {
          const newMonth = month === 11 ? 0 : month + 1
          const newYear = month === 11 ? year + 1 : year
          setMonth(newMonth)
          setYear(newYear)
        }}
        onDateSelect={(date) => console.log('Selected:', date)}
      />
    )
  },
}
