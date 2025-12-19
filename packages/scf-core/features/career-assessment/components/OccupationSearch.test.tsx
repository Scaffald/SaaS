import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OccupationSearch } from './OccupationSearch'
import { renderWithProviders } from '@test-helpers/test-utils'

// Mock useDebounce
vi.mock('@scf/core/utils/useDebounce', () => ({
  useDebounce: (value: string) => value, // Return value immediately for testing
}))

// Mock API
const mockSearchOccupations = vi.fn()
const mockTrackEvent = vi.fn()

vi.mock('@scf/core/utils/api', () => ({
  api: {
    onet: {
      searchOccupations: {
        useQuery: vi.fn((input: { query: string; limit: number }, options?: { enabled?: boolean }) => {
          if (options?.enabled === false) {
            return { data: undefined, isLoading: false, error: null }
          }
          return mockSearchOccupations(input.query)
        }),
      },
    },
    engagement: {
      trackEvent: {
        useMutation: vi.fn(() => ({
          mutate: mockTrackEvent,
        })),
      },
    },
    useUtils: vi.fn(() => ({})),
  },
}))

// Mock Tamagui components
vi.mock('@unicornlove/ui', async () => {
  const React = await import('react')
  return {
    Input: ({ value, onChangeText, onFocus, onBlur, placeholder, disabled, ...props }: {
      value: string
      onChangeText?: (text: string) => void
      onFocus?: () => void
      onBlur?: () => void
      placeholder?: string
      disabled?: boolean
      [key: string]: unknown
    }) => (
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    ),
    Spinner: () => <div data-testid="spinner">Loading...</div>,
    Text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
    XStack: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    YStack: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  }
})

describe('OccupationSearch', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchOccupations.mockReturnValue({
      data: {
        occupations: [
          { onetsoc_code: '15-1252.00', title: 'Software Developers' },
          { onetsoc_code: '15-1253.00', title: 'Software Quality Assurance Analysts' },
        ],
      },
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render search input with placeholder', () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} placeholder="Search occupations..." />
    )

    const input = screen.getByPlaceholderText('Search occupations...')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when occupation is selected', async () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    
    // Type to trigger search
    fireEvent.change(input, { target: { value: 'software' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(mockSearchOccupations).toHaveBeenCalled()
    })

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Software Developers')).toBeInTheDocument()
    })

    // Click on an occupation
    const occupation = screen.getByText('Software Developers')
    fireEvent.click(occupation)

    expect(mockOnChange).toHaveBeenCalledWith('15-1252.00', 'Software Developers')
  })

  it('should show loading spinner when searching', () => {
    mockSearchOccupations.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 'software' } })

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('should display search results in dropdown', async () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 'software' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Software Developers')).toBeInTheDocument()
      expect(screen.getByText('15-1252.00')).toBeInTheDocument()
      expect(screen.getByText('Software Quality Assurance Analysts')).toBeInTheDocument()
    })
  })

  it('should not trigger search with less than 2 characters', () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 's' } })

    // Should not call search with only 1 character
    expect(mockSearchOccupations).not.toHaveBeenCalled()
  })

  it('should trigger search with 2 or more characters', async () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 'so' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(mockSearchOccupations).toHaveBeenCalled()
    })
  })

  it('should display error message when search fails', async () => {
    mockSearchOccupations.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Search failed' },
    })

    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 'software' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText(/Unable to load occupations/i)).toBeInTheDocument()
    })
  })

  it('should display "no results" message when search returns empty', async () => {
    mockSearchOccupations.mockReturnValue({
      data: { occupations: [] },
      isLoading: false,
      error: null,
    })

    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    fireEvent.change(input, { target: { value: 'xyzabc' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText(/No occupations found/i)).toBeInTheDocument()
    })
  })

  it('should respect disabled state', () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} disabled />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    expect(input).toBeDisabled()
  })

  it('should clear selection when input is cleared', () => {
    renderWithProviders(
      <OccupationSearch value="15-1252.00" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...') as HTMLInputElement
    
    // Clear the input
    fireEvent.change(input, { target: { value: '' } })

    expect(mockOnChange).toHaveBeenCalledWith('', '')
  })

  it('should hide dropdown when input loses focus', async () => {
    renderWithProviders(
      <OccupationSearch value="" onChange={mockOnChange} />
    )

    const input = screen.getByPlaceholderText('Search for your occupation...')
    
    // Type and focus to show dropdown
    fireEvent.change(input, { target: { value: 'software' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Software Developers')).toBeInTheDocument()
    })

    // Blur the input
    fireEvent.blur(input)

    // Wait for dropdown to hide (200ms delay)
    await waitFor(() => {
      expect(screen.queryByText('Software Developers')).not.toBeInTheDocument()
    }, { timeout: 300 })
  })
})

