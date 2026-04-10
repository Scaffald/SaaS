import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RIASECAssessmentWizard } from './RIASECAssessmentWizard'
import { renderWithProviders } from '@test-helpers/test-utils'
import { careerAssessmentDefaults } from '@scf/core/features/career-assessment/config/career-assessment-schema'

const mockRouterPush = vi.fn()
const mockToastShow = vi.fn()
const mockGetRIASECStatus = vi.fn()
const mockSaveCareerAssessment = vi.fn()
const mockInvalidate = vi.fn()

vi.mock('expo-router', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('@scaffald/ui', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useToast: () => ({
    show: mockToastShow,
  }),
}))

vi.mock('@scf/core/utils/api', () => ({
  api: {
    onet: {
      getRIASECStatus: {
        useQuery: () => mockGetRIASECStatus(),
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
        getRIASECStatus: {
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

// Mock RiasecQuickAssessment
vi.mock('@scf/core/features/career-assessment/components/RiasecQuickAssessment', () => ({
  RiasecQuickAssessment: ({ value, onChange, disabled }: {
    value: Record<string, number>
    onChange: (scores: Record<string, number>) => void
    disabled?: boolean
  }) => (
    <div data-testid="riasec-assessment">
      {Object.entries(value).map(([key, val]) => (
        <input
          key={key}
          type="range"
          min={1}
          max={5}
          value={val}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
          data-testid={`slider-${key}`}
        />
      ))}
    </div>
  ),
}))

// Mock Button
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  const React = await import('react')
  return {
    ...actual,
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
    Stack: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useThemeContext: () => ({ theme: 'light' as const }),
    useToast: () => ({ show: () => {} }),
  }
})

describe('RIASECAssessmentWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false, scores: null },
      isLoading: false,
      error: null,
    })
  })

  it('should render wizard with title and description', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    expect(screen.getByTestId('assessment-wizard')).toBeInTheDocument()
    expect(screen.getByText('Career Interests')).toBeInTheDocument()
    expect(screen.getByText(/Rate your interest in each career dimension/i)).toBeInTheDocument()
  })

  it('should load existing scores when available', () => {
    const existingScores = {
      realistic: 4,
      investigative: 5,
      artistic: 2,
      social: 3,
      enterprising: 4,
      conventional: 3,
    }

    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false, scores: existingScores },
      isLoading: false,
      error: null,
    })

    renderWithProviders(<RIASECAssessmentWizard />)

    const realisticSlider = screen.getByTestId('slider-realistic') as HTMLInputElement
    expect(realisticSlider.value).toBe('4')
  })

  it('should show loading state', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders(<RIASECAssessmentWizard />)

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to load' },
    })

    renderWithProviders(<RIASECAssessmentWizard />)

    expect(screen.getByTestId('error')).toBeInTheDocument()
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  it('should disable complete button when not all sliders are rated', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    const completeButton = screen.getByText('Complete Assessment')
    expect(completeButton).toBeDisabled()
  })

  it('should enable complete button when all sliders are rated', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values (1-5)
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '3' } })
    })

    const completeButton = screen.getByText('Complete Assessment')
    expect(completeButton).not.toBeDisabled()
  })

  it('should save assessment and navigate on completion', async () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '3' } })
    })

    const completeButton = screen.getByText('Complete Assessment')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(mockSaveCareerAssessment).toHaveBeenCalled()
    })

    expect(mockInvalidate).toHaveBeenCalled()
    expect(mockToastShow).toHaveBeenCalledWith('Assessment Complete', {
      message: 'Your career interests have been saved!',
    })
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show error toast on save failure', async () => {
    mockSaveCareerAssessment.mockRejectedValueOnce({ message: 'Save failed' })

    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '3' } })
    })

    const completeButton = screen.getByText('Complete Assessment')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith('Error', {
        message: 'Save failed',
      })
    })
  })
})

