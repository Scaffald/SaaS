import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuickApplyModal } from '../QuickApplyModal'

const mockOnOpenChange = vi.fn()
const mockOnSuccess = vi.fn()
const mockShowToast = vi.fn()
const mockMutateAsync = vi.fn()

// Must use vi.hoisted() so the variable is available when vi.mock factories run
const { mockCreateMapboxProvider } = vi.hoisted(() => ({
  mockCreateMapboxProvider: vi.fn(),
}))

// Store mutation callbacks so tests can trigger success/error flows
const mutationCallbacks: {
  onSuccess?: (data: { id: string }) => void
  onError?: (error: { message?: string }) => void
} = {}

vi.mock('@scf/core/utils/jobs-sdk-hooks', () => ({
  useCreateJobApplicationMutation: (callbacks?: {
    onSuccess?: (data: { id: string }) => void
    onError?: (error: { message?: string }) => void
  }) => {
    if (callbacks?.onSuccess) mutationCallbacks.onSuccess = callbacks.onSuccess
    if (callbacks?.onError) mutationCallbacks.onError = callbacks.onError
    return { mutateAsync: mockMutateAsync, isPending: false }
  },
}))

vi.mock('@scf/core/utils/mapbox-geocoding-provider', () => ({
  createMapboxGeocodingProvider: mockCreateMapboxProvider,
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const React = require('react')
  const El =
    (tag: string) =>
    ({ children, ...rest }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement(tag, rest, children)
  return {
    ...actual,
    useThemeContext: () => ({ theme: 'light' as const }),
    useToast: () => ({ show: mockShowToast }),
    Modal: ({
      children,
      visible,
    }: {
      children?: React.ReactNode
      visible?: boolean
    }) =>
      visible
        ? React.createElement('div', { role: 'dialog', 'data-testid': 'modal' }, children)
        : null,
    ModalHeader: ({
      title,
      description,
      onClose,
    }: {
      title?: string
      description?: string
      onClose?: () => void
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'modal-header' },
        React.createElement('span', null, title),
        description && React.createElement('span', null, description),
        React.createElement(
          'button',
          { type: 'button', 'aria-label': 'Close', onClick: onClose },
          'Close',
        ),
      ),
    ModalContent: El('div'),
    AddressAutocomplete: ({
      value,
      onChange,
      onAddressSelect,
      placeholder,
    }: {
      value: string
      onChange: (text: string) => void
      onAddressSelect: (address: { formattedAddress: string }) => void
      placeholder?: string
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'address-autocomplete' },
        React.createElement('input', {
          'data-testid': 'address-input',
          value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
          placeholder,
        }),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'select-address',
            onClick: () => onAddressSelect({ formattedAddress: '123 Main St' }),
          },
          'Select',
        ),
      ),
    ResponsiveSelect: ({
      value,
      onValueChange,
      options,
      placeholder,
      testID,
    }: {
      value?: string
      onValueChange?: (val: string) => void
      options?: Array<{ value: string; label: string }>
      placeholder?: string
      testID?: string
    }) =>
      React.createElement(
        'select',
        {
          'data-testid': testID,
          value: value ?? '',
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value),
        },
        React.createElement('option', { value: '' }, placeholder),
        ...(options ?? []).map((opt: { value: string; label: string }) =>
          React.createElement('option', { key: opt.value, value: opt.value }, opt.label),
        ),
      ),
    Stack: El('div'),
    Row: El('div'),
    Text: El('span'),
    Label: El('label'),
    Button: ({
      children,
      onPress,
      disabled,
      ...rest
    }: {
      children?: React.ReactNode
      onPress?: () => void
      disabled?: boolean
      [key: string]: unknown
    }) =>
      React.createElement(
        'button',
        { type: 'button', disabled, onClick: onPress, ...rest },
        children,
      ),
  }
})

describe('QuickApplyModal', () => {
  const defaultProps = {
    jobId: 'job-123',
    jobTitle: 'Software Engineer',
    organizationName: 'Tech Corp',
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
    requiredSkills: ['React', 'TypeScript'],
    optionalSkills: ['Node.js'],
  }

  // Fill all required form fields using mock UI elements
  const fillRequiredFields = () => {
    fireEvent.change(screen.getByTestId('address-input'), { target: { value: 'New York' } })
    fireEvent.change(screen.getByTestId('years_experience'), { target: { value: '1-3' } })
    fireEvent.change(screen.getByTestId('earliest_start_date'), { target: { value: 'Immediately' } })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mutationCallbacks.onSuccess = undefined
    mutationCallbacks.onError = undefined
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token'
    // Re-setup after vi.clearAllMocks() resets mock implementations
    mockCreateMapboxProvider.mockReturnValue({})
    mockMutateAsync.mockImplementation(async () => {
      const result = { id: 'app-123' }
      mutationCallbacks.onSuccess?.(result)
      return result
    })
  })

  it('renders modal when open', () => {
    render(<QuickApplyModal {...defaultProps} />)

    expect(screen.getByText(/Apply to Tech Corp/)).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<QuickApplyModal {...defaultProps} open={false} />)

    expect(screen.queryByText(/Apply to Tech Corp/)).not.toBeInTheDocument()
  })

  it('displays required and optional skills', () => {
    render(<QuickApplyModal {...defaultProps} />)

    expect(screen.getByText('Required skills')).toBeInTheDocument()
    expect(screen.getByText('React, TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Optional skills')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })

  it('validates required fields before submission', async () => {
    render(<QuickApplyModal {...defaultProps} />)

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Current location is required')).toBeInTheDocument()
    })

    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('submits application when all required fields are filled', async () => {
    mockMutateAsync.mockImplementation(async () => {
      const result = { id: 'app-123' }
      mutationCallbacks.onSuccess?.(result)
      return result
    })
    render(<QuickApplyModal {...defaultProps} />)

    fillRequiredFields()
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })
  })

  it('shows success state after submission', async () => {
    mockMutateAsync.mockImplementation(async () => {
      const result = { id: 'app-123' }
      mutationCallbacks.onSuccess?.(result)
      return result
    })
    render(<QuickApplyModal {...defaultProps} />)

    fillRequiredFields()
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Application Submitted!')).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    mockMutateAsync.mockImplementation(async () => {
      const result = { id: 'app-123' }
      mutationCallbacks.onSuccess?.(result)
      return result
    })
    render(<QuickApplyModal {...defaultProps} />)

    fillRequiredFields()
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('app-123')
    })
  })

  it('closes modal when close button is clicked', () => {
    render(<QuickApplyModal {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets form when close button is clicked', () => {
    render(<QuickApplyModal {...defaultProps} />)

    const addressInput = screen.getByTestId('address-input')
    fireEvent.change(addressInput, { target: { value: 'New York' } })
    expect(addressInput).toHaveValue('New York')

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.getByTestId('address-input')).toHaveValue('')
  })

  it('shows toast notification on success', async () => {
    mockMutateAsync.mockImplementation(async () => {
      const result = { id: 'app-123' }
      mutationCallbacks.onSuccess?.(result)
      return result
    })
    render(<QuickApplyModal {...defaultProps} />)

    fillRequiredFields()
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalled()
    })
  })

  it('handles submission errors', async () => {
    mockMutateAsync.mockImplementation(async () => {
      mutationCallbacks.onError?.({ message: 'Submission failed' })
      throw new Error('Submission failed')
    })
    render(<QuickApplyModal {...defaultProps} />)

    fillRequiredFields()
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      )
    })
  })
})
