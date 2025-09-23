const addressAutocompleteMock = vi.hoisted(() => ({
  renderSpy: vi.fn(),
  suggestion: {
    id: '1',
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '12345',
    formatted: '123 Main St, Springfield, IL 12345',
  },
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

vi.mock('../../AddressAutocomplete', async () => {
  const React = await import('react')

  // biome-ignore lint/suspicious/noExplicitAny: Test mock component with flexible props
  const AddressAutocompleteInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    addressAutocompleteMock.renderSpy(props)
    const {
      onValueChange,
      onSuggestionSelected,
      onBlur,
      value,
      debounceMs: _debounceMs,
      minQueryLength: _min,
      ...rest
    } = props

    return (
      <div>
        <input
          data-testid="address-autocomplete"
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          onBlur={onBlur}
          {...rest}
        />
        <button
          type="button"
          onClick={() => onSuggestionSelected?.(addressAutocompleteMock.suggestion)}
        >
          Use suggestion
        </button>
      </div>
    )
  })

  return { AddressAutocompleteInput }
})

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { fireEvent, render, screen } from '../../../../test/test-utils'
import { AddressField } from '../AddressField'
import { useFieldInfo, useTsController } from '@ts-react/form'

type AddressValue = { street: string; zipCode: string }

describe('AddressField', () => {
  const mockedUseTsController = vi.mocked(useTsController)
  const mockedUseFieldInfo = vi.mocked(useFieldInfo)

  beforeEach(() => {
    mockedUseFieldInfo.mockReturnValue({ label: 'Mailing address' })
    mockedUseTsController.mockReturnValue({
      field: {
        value: { street: '', zipCode: '' },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)
    addressAutocompleteMock.renderSpy.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders labels for the address fields', () => {
    render(<AddressField size="$3" />)

    expect(screen.getByText('Mailing address')).toBeInTheDocument()
    expect(screen.getByLabelText('Street')).toBeInTheDocument()
    expect(screen.getByLabelText('US ZIP Code')).toBeInTheDocument()
  })

  test('updates the street value when typing', () => {
    const value: AddressValue = { street: '', zipCode: '99999' }
    const onChange = vi.fn()

    mockedUseTsController.mockReturnValue({
      field: {
        value,
        onChange,
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<AddressField size="$3" />)

    const streetInput = screen.getByLabelText('Street') as HTMLInputElement
    fireEvent.change(streetInput, { target: { value: '456 Oak Ave' } })

    expect(onChange).toHaveBeenCalledWith({ street: '456 Oak Ave', zipCode: '99999' })
  })

  test('applies suggestion selections to the field value', () => {
    const onChange = vi.fn()
    mockedUseTsController.mockReturnValue({
      field: {
        value: { street: '', zipCode: '' },
        onChange,
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<AddressField size="$3" />)

    fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }))
    expect(onChange).toHaveBeenCalledWith({
      street: '123 Main St',
      zipCode: '12345',
    })
  })

  test('updates the zip code when changed', () => {
    const value: AddressValue = { street: 'Existing', zipCode: '00000' }
    const onChange = vi.fn()

    mockedUseTsController.mockReturnValue({
      field: {
        value,
        onChange,
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: false },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<AddressField size="$3" />)

    const zipInput = screen.getByLabelText('US ZIP Code') as HTMLInputElement
    fireEvent.change(zipInput, { target: { value: '54321' } })

    expect(onChange).toHaveBeenCalledWith({ street: 'Existing', zipCode: '54321' })
  })

  test('disables inputs while submitting', () => {
    mockedUseTsController.mockReturnValue({
      field: {
        value: { street: '', zipCode: '' },
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: { current: null },
      },
      error: {},
      formState: { isSubmitting: true },
      // biome-ignore lint/suspicious/noExplicitAny: Test mock with flexible types
    } as any)

    render(<AddressField size="$3" />)

    const streetInput = screen.getByLabelText('Street') as HTMLInputElement
    const zipInput = screen.getByLabelText('US ZIP Code') as HTMLInputElement

    expect(streetInput).toBeDisabled()
    expect(zipInput).toBeDisabled()
    expect(addressAutocompleteMock.renderSpy).toHaveBeenCalled()
    expect(addressAutocompleteMock.renderSpy.mock.calls[0][0].disabled).toBe(true)
  })
})
