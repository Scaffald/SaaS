import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OccupationAssessmentWizard } from './OccupationAssessmentWizard'
import { renderWithProviders } from '@test-helpers/test-utils'

const mockRouterPush = vi.fn()
const mockToastShow = vi.fn()
const mockGetOccupationStatus = vi.fn()
const mockSaveCareerAssessment = vi.fn()
const mockInvalidate = vi.fn()

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@scf/core/utils/api', () => ({
  api: {
    onet: {
      getOccupationStatus: {
        useQuery: () => mockGetOccupationStatus(),
      },
      saveCareerAssessment: {
        useMutation: (callbacks?: { onSuccess?: () => void; onError?: (error: { message?: string }) => void }) => {
          if (callbacks) {
            mockSaveCareerAssessment.mockImplementation(async (data: unknown) => {
              try {
                callbacks.onSuccess?.()
                return { success: true }
              } catch (error) {
                callbacks.onError?.(error as { message?: string })
                throw error
              }
            })
          }
          return {
            mutate: mockSaveCareerAssessment,
            isPending: false,
          }
        },
      },
    },
    useUtils: () => ({
      onet: {
        getOccupationStatus: {
          invalidate: mockInvalidate,
        },
      },
    }),
  },
}))

// Mock AssessmentWizard
vi.mock('@scf/core/features/assessments', () => ({
  AssessmentWizard: ({ children, title, description, isLoading, error }: {
    children: React.ReactNode
    title?: string
    description?: string
    isLoading?: boolean
    error?: Error | null
  }) => {
    if (isLoading) return <div data-testid="loading">Loading...</div>
    if (error) return <div data-testid="error">{error.message}</div>
    return (
      <div data-testid="assessment-wizard">
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
        {children}
      </div>
    )
  },
}))

// Mock OccupationSearch
vi.mock('@scf/core/features/career-assessment/components/OccupationSearch', () => ({
  OccupationSearch: ({ value, onChange, placeholder, disabled }: {
    value: string
    onChange: (code: string, title: string) => void
    placeholder?: string
    disabled?: boolean
  }) => (
    <div data-testid="occupation-search">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value, e.target.value)}
        data-testid="occupation-input"
      />
    </div>
  ),
}))

// Mock Button and UI components
vi.mock('@unicornlove/ui', async () => {
  const React = await import('react')
  return {
    Button: ({ children, onPress, disabled, ...props }: {
      children: React.ReactNode
      onPress?: () => void
      disabled?: boolean
      [key: string]: unknown
    }) => (
      <button onClick={onPress} disabled={disabled} {...props}>
        {children}
      </button>
    ),
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

vi.mock('@tamagui/lucide-icons', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  X: () => <span data-testid="x-icon">×</span>,
}))

describe('OccupationAssessmentWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOccupationStatus.mockReturnValue({
      data: {
        isCompleted: false,
        currentOccupationCode: null,
        targetOccupationCodes: [],
      },
      isLoading: false,
      error: null,
    })
  })

  it('should render wizard with title and description', () => {
    renderWithProviders(<OccupationAssessmentWizard />)

    expect(screen.getByTestId('assessment-wizard')).toBeInTheDocument()
    expect(screen.getByText('Occupation Preferences')).toBeInTheDocument()
    expect(screen.getByText(/Tell us about your current and target occupations/i)).toBeInTheDocument()
  })

  it('should load existing occupations when available', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: {
        isCompleted: false,
        currentOccupationCode: '15-1252.00',
        targetOccupationCodes: ['15-1253.00'],
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<OccupationAssessmentWizard />)

    const inputs = screen.getAllByTestId('occupation-input')
    expect(inputs[0]).toHaveValue('15-1252.00')
    expect(inputs[1]).toHaveValue('15-1253.00')
  })

  it('should allow adding target occupations', () => {
    renderWithProviders(<OccupationAssessmentWizard />)

    const addButton = screen.getByText('Add Target Occupation')
    fireEvent.click(addButton)

    const inputs = screen.getAllByTestId('occupation-input')
    expect(inputs.length).toBeGreaterThan(1) // Should have current + at least one target
  })

  it('should allow removing target occupations', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: {
        isCompleted: false,
        currentOccupationCode: null,
        targetOccupationCodes: ['15-1252.00'],
      },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<OccupationAssessmentWizard />)

    const removeButtons = screen.getAllByTestId('x-icon')
    expect(removeButtons.length).toBeGreaterThan(0)

    fireEvent.click(removeButtons[0])

    const inputs = screen.getAllByTestId('occupation-input')
    // Should only have current occupation input left
    expect(inputs.length).toBe(1)
  })

  it('should save occupations and navigate on completion', async () => {
    renderWithProviders(<OccupationAssessmentWizard />)

    // Set current occupation
    const currentInput = screen.getAllByTestId('occupation-input')[0]
    fireEvent.change(currentInput, { target: { value: '15-1252.00' } })

    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockSaveCareerAssessment).toHaveBeenCalled()
    })

    expect(mockInvalidate).toHaveBeenCalled()
    expect(mockToastShow).toHaveBeenCalledWith('Saved', {
      message: 'Your occupation preferences have been saved!',
    })
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show error toast on save failure', async () => {
    mockSaveCareerAssessment.mockRejectedValueOnce({ message: 'Save failed' })

    renderWithProviders(<OccupationAssessmentWizard />)

    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith('Error', {
        message: 'Save failed',
      })
    })
  })
})

