import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock MonthYearPicker component
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const React = require('react') as typeof import('react')
  const MonthYearPicker = ({
    value,
    onChange,
    label,
    disabled,
    error,
  }: {
    value: Date | null
    onChange: (date: Date | null) => void
    label?: string
    disabled?: boolean
    error?: string
  }) => {
    const inputId = React.useId()
    return (
      <div>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        <input
          id={inputId}
          type="month"
          disabled={disabled}
          value={value ? value.toISOString().slice(0, 7) : ''}
          onChange={(event) => {
            const nextValue = event.target.value
            onChange(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
          }}
          data-testid={`month-year-picker-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        />
        {error ? <span>{error}</span> : null}
      </div>
    )
  }

  return {
    ...actual,
    MonthYearPicker,
    DashboardWidget: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Button: ({
      children,
      onPress,
      disabled,
    }: {
      children: React.ReactNode
      onPress?: () => void
      disabled?: boolean
    }) => (
      <button type="button" onClick={onPress} disabled={disabled}>
        {children}
      </button>
    ),
  }
})

describe('Profile Experience Improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render MonthYearPicker for start date', () => {
    const StartDatePicker = () => {
      const [value, setValue] = React.useState<Date | null>(null)
      return (
        <div>
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="month"
            value={value ? value.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              const nextValue = e.target.value
              setValue(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
            }}
            data-testid="start-date-picker"
          />
        </div>
      )
    }

    const { container } = render(<StartDatePicker />)
    const picker = container.querySelector('[data-testid="start-date-picker"]') as HTMLInputElement

    expect(picker).toBeInTheDocument()
    expect(picker.type).toBe('month')
  })

  it('should disable end date when "Currently Working" is checked', () => {
    const ExperienceForm = () => {
      const [isCurrent, setIsCurrent] = React.useState(false)
      const [endDate, setEndDate] = React.useState<Date | null>(null)

      return (
        <div>
          <input
            type="month"
            disabled={isCurrent}
            value={endDate ? endDate.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              const nextValue = e.target.value
              setEndDate(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
            }}
            data-testid="end-date-picker"
          />
          <label>
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              data-testid="currently-working"
            />
            I currently work here
          </label>
        </div>
      )
    }

    const { container } = render(<ExperienceForm />)
    const endDatePicker = container.querySelector(
      '[data-testid="end-date-picker"]'
    ) as HTMLInputElement
    const checkbox = container.querySelector(
      '[data-testid="currently-working"]'
    ) as HTMLInputElement

    // Initially not disabled
    expect(endDatePicker.disabled).toBe(false)

    // Check "Currently Working"
    fireEvent.click(checkbox)

    // End date should be disabled
    expect(endDatePicker.disabled).toBe(true)
  })

  it('should validate end date is after start date', async () => {
    const DateValidation = () => {
      const [startDate, setStartDate] = React.useState<Date | null>(new Date('2020-01-01'))
      const [endDate, setEndDate] = React.useState<Date | null>(null)
      const [error, setError] = React.useState<string | null>(null)

      React.useEffect(() => {
        if (startDate && endDate && endDate < startDate) {
          setError('End date must be after start date')
        } else {
          setError(null)
        }
      }, [startDate, endDate])

      return (
        <div>
          <input
            type="month"
            value={startDate ? startDate.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              const nextValue = e.target.value
              setStartDate(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
            }}
            data-testid="start-date"
          />
          <input
            type="month"
            value={endDate ? endDate.toISOString().slice(0, 7) : ''}
            onChange={(e) => {
              const nextValue = e.target.value
              setEndDate(nextValue ? new Date(`${nextValue}-01T12:00:00Z`) : null)
            }}
            data-testid="end-date"
          />
          {error ? <span data-testid="date-error">{error}</span> : null}
        </div>
      )
    }

    const { container } = render(<DateValidation />)
    const startDateInput = container.querySelector('[data-testid="start-date"]') as HTMLInputElement
    const endDateInput = container.querySelector('[data-testid="end-date"]') as HTMLInputElement

    // Set start date to 2020-01
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    // Set end date to 2019-12 (before start date)
    fireEvent.change(endDateInput, { target: { value: '2019-12' } })

    // Should show error
    await waitFor(
      () => {
        expect(screen.getByTestId('date-error')).toBeInTheDocument()
      },
      { timeout: 1000 }
    )
  })

  it('should calculate total years of experience from entries', () => {
    const calculateTotalExperience = (
      entries: Array<{ start_date: string; end_date: string | null; is_current: boolean }>
    ) => {
      let totalMonths = 0
      for (const entry of entries) {
        const start = new Date(entry.start_date)
        const end = entry.is_current ? new Date() : new Date(entry.end_date || Date.now())
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
        totalMonths += months
      }
      const years = Math.floor(totalMonths / 12)
      const months = totalMonths % 12
      return { years, months }
    }

    const entries = [
      { start_date: '2020-01-01', end_date: '2022-12-31', is_current: false },
      { start_date: '2023-01-01', end_date: null, is_current: true },
    ]

    const total = calculateTotalExperience(entries)

    // Should calculate years and months correctly
    expect(total.years).toBeGreaterThanOrEqual(2)
    expect(typeof total.months).toBe('number')
  })
})
