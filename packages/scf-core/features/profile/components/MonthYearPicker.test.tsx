import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@test-helpers/test-utils'
import { MonthPicker, MonthYearPicker } from './MonthYearPicker'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    Input: ({
      value,
      onChangeText,
      placeholder,
    }: {
      value: string
      onChangeText?: (text: string) => void
      placeholder?: string
    }) => (
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
        placeholder={placeholder}
      />
    ),
  }
})

// East of UTC, where the old picker + toISOString() stored the previous month (#1358).
const ORIGINAL_TZ = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Asia/Tokyo'
})
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = ORIGINAL_TZ
})

const field = () => screen.getByPlaceholderText('YYYY-MM') as HTMLInputElement

describe('MonthPicker', () => {
  it('shows the stored month and emits the typed one as YYYY-MM-01', () => {
    const onChange = vi.fn()
    renderWithProviders(<MonthPicker value="2024-09-01" onChange={onChange} />)
    expect(field().value).toBe('2024-09')

    fireEvent.change(field(), { target: { value: '2025-01' } })
    expect(onChange).toHaveBeenLastCalledWith('2025-01-01')
  })

  it('keeps a half-typed month on screen while the form holds null', () => {
    const onChange = vi.fn()
    const { rerender } = renderWithProviders(<MonthPicker value={null} onChange={onChange} />)
    fireEvent.change(field(), { target: { value: '2024-' } })
    expect(onChange).toHaveBeenLastCalledWith(null)
    rerender(<MonthPicker value={null} onChange={onChange} />)
    expect(field().value).toBe('2024-')
  })

  it('follows the form when it resets to another month', () => {
    const { rerender } = renderWithProviders(<MonthPicker value="2024-09-01" onChange={vi.fn()} />)
    rerender(<MonthPicker value="2019-03-01" onChange={vi.fn()} />)
    expect(field().value).toBe('2019-03')
  })
})

describe('MonthYearPicker (Date)', () => {
  it('round-trips a local Date without shifting the month', () => {
    const onChange = vi.fn()
    renderWithProviders(<MonthYearPicker value={new Date(2024, 8, 1)} onChange={onChange} />)
    expect(field().value).toBe('2024-09')

    fireEvent.change(field(), { target: { value: '2024-10' } })
    const date = onChange.mock.lastCall?.[0] as Date
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(1)
  })
})
