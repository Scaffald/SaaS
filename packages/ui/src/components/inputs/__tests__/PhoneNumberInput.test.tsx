import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const selectHandler = vi.hoisted<{ current: (value: string) => void }>(() => ({
  current: () => {},
}))

vi.mock('tamagui', () => {
  const YStack = ({ children, ...rest }: { children?: ReactNode }) => (
    <div {...rest}>{children}</div>
  )
  const XStack = ({ children, ...rest }: { children?: ReactNode }) => (
    <div {...rest}>{children}</div>
  )
  const Text = ({ children, ...rest }: { children?: ReactNode }) => <span {...rest}>{children}</span>
  const Input = ({ onChangeText, ...rest }: { onChangeText?: (value: string) => void }) => (
    <input
      {...rest}
      value={rest.value ?? ''}
      onChange={(event) => onChangeText?.(event.target.value)}
    />
  )

  const Select = ({ children, onValueChange, value }: any) => {
    selectHandler.current = onValueChange
    return (
      <div data-testid="country-select" data-value={value}>
        {children}
      </div>
    )
  }

  Select.Trigger = ({ children, ...rest }: any) => <button type="button" {...rest}>{children}</button>
  Select.Value = ({ children }: any) => <span>{children}</span>
  Select.Content = ({ children }: any) => <div>{children}</div>
  Select.ScrollUpButton = () => null
  Select.ScrollDownButton = () => null
  Select.Viewport = ({ children }: any) => <div>{children}</div>
  Select.Item = ({ value, children }: any) => (
    <button type="button" onClick={() => selectHandler.current(value)} data-testid={`country-${value}`}>
      {children}
    </button>
  )

  const Adapt = ({ children }: { children?: ReactNode }) => <>{children}</>
  Adapt.Contents = ({ children }: { children?: ReactNode }) => <>{children}</>

  const Sheet = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.Frame = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.ScrollView = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.Overlay = () => null

  const AnimatePresence = ({ children }: { children?: ReactNode }) => <>{children}</>

  const useWindowDimensions = () => ({ width: 1024 })

  const Paragraph = ({ children, ...rest }: any) => <p {...rest}>{children}</p>

  return {
    YStack,
    XStack,
    Text,
    Input,
    Select,
    Adapt,
    Sheet,
    AnimatePresence,
    useWindowDimensions,
    Paragraph,
  }
})

vi.mock('../../config/countries', () => ({
  COUNTRIES: [
    { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  ],
  findCountryByCode: (code: string) =>
    ({ US: { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' }, GB: { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' } } as Record<string, unknown>)[code] ?? null,
  getDefaultCountry: () => ({ code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' }),
}))

const formatPhoneNumber = vi.fn((value: string) => `formatted-${value}`)
const getE164Format = vi.fn((value: string) => `+1${value}`)
const getPhoneRegionCode = vi.fn((value: string) => (value.startsWith('+44') ? 'GB' : 'US'))
const isValidPhoneNumber = vi.fn((value: string) => value.replace(/\D/g, '').length >= 10)

vi.mock('@app/schemas/common/phone', () => ({
  formatPhoneNumber,
  getE164Format,
  getPhoneRegionCode,
  isValidPhoneNumber,
}))

const { PhoneNumberInput } = await import('../PhoneNumberInput')

describe('PhoneNumberInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    formatPhoneNumber.mockClear()
    getE164Format.mockClear()
    getPhoneRegionCode.mockClear()
    isValidPhoneNumber.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats and validates input with debounce before calling onChange', async () => {
    const onChange = vi.fn()

    render(<PhoneNumberInput onChange={onChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1234567890' } })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await vi.runOnlyPendingTimersAsync()

    expect(formatPhoneNumber).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('+11234567890')
  })

  it('updates selected country when country selector changes', () => {
    const onChange = vi.fn()
    render(<PhoneNumberInput value="+441234567890" onChange={onChange} />)

    act(() => {
      selectHandler.current('GB')
    })

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('surfaces validation error for invalid numbers', async () => {
    isValidPhoneNumber.mockReturnValue(false)
    const onChange = vi.fn()

    render(<PhoneNumberInput onChange={onChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '123' } })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    await vi.runOnlyPendingTimersAsync()

    expect(onChange).toHaveBeenCalledWith('123')
    expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
  })
})
