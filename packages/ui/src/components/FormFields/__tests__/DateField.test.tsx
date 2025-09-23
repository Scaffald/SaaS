const datePickerMock = vi.hoisted(() => ({
  renderSpy: vi.fn(),
}))

vi.mock('../../Shake', async () => {
  await import('react')
  return {
    Shake: ({ children }: { children: unknown }) => <>{children}</>,
  }
})

vi.mock('@ts-react/form', () => ({
  useTsController: vi.fn(),
  useFieldInfo: vi.fn(),
}))

vi.mock('../../elements/datepicker/DatePicker', async () => {
  const React = await import('react')

  // biome-ignore lint/suspicious/noExplicitAny: Test mock component with flexible props
  const DatePickerExample = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    datePickerMock.renderSpy(props)
    const {
      onChangeText,
      onBlur,
      placeholderTextColor: _placeholderTextColor,
      size: _size,
      ...rest
    } = props
    return (
      <input
        data-testid="date-input"
        ref={ref as React.ForwardedRef<HTMLInputElement>}
        onChange={(event) => onChangeText?.(event.target.value)}
        onBlur={onBlur}
        {...rest}
      />
    )
  })

  return { DatePickerExample }
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DateField } from '../DateField'
import { render, screen, fireEvent } from '../../../../test/test-utils'
import { useFieldInfo, useTsController } from '@ts-react/form'

type DateFieldValue = { dateValue: Date }

describe('DateField', () => {
  const mockedUseTsController = vi.mocked(useTsController)
  const mockedUseFieldInfo = vi.mocked(useFieldInfo)

  beforeEach(() => {
    mockedUseFieldInfo.mockReturnValue(
      { label: 'Event date' } as unknown as ReturnType<typeof useFieldInfo>
    )
    mockedUseTsController.mockReturnValue({
      field: {
        value: { dateValue: new Date('2024-01-01T00:00:00.000Z') },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)
    datePickerMock.renderSpy.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders the field label and associates the input id', () => {
    render(<DateField size="$3" />)

    expect(screen.getByText('Event date')).toBeInTheDocument()
    const input = screen.getByTestId('date-input')
    expect(input).toHaveAttribute('id')
    expect(input.getAttribute('id')).toMatch(/date-value$/)
  })

  test('propagates changes and blur events to the field controller', () => {
    const fieldValue: DateFieldValue = { dateValue: new Date('2024-02-01T00:00:00.000Z') }
    const onChange = vi.fn()
    const onBlur = vi.fn()

    mockedUseTsController.mockReturnValue({
      field: {
        value: fieldValue,
        onChange,
        onBlur,
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<DateField size="$3" />)

    const input = screen.getByTestId('date-input')
    fireEvent.change(input, { target: { value: '2025-03-15T00:00:00.000Z' } })
    expect(onChange).toHaveBeenCalledWith({
      ...fieldValue,
      dateValue: new Date('2025-03-15T00:00:00.000Z'),
    })

    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalled()
  })

  test('disables the date picker while the form is submitting', () => {
    mockedUseTsController.mockReturnValue({
      field: {
        value: { dateValue: new Date('2024-01-01T00:00:00.000Z') },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: true },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<DateField size="$3" />)

    const input = screen.getByTestId('date-input')
    expect(input).toBeDisabled()
    expect(datePickerMock.renderSpy).toHaveBeenCalled()
    expect(datePickerMock.renderSpy.mock.calls[0][0].disabled).toBe(true)
  })
})
