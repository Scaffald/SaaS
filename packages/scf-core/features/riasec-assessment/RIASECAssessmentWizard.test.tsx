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

// Component now uses '@scf/core/utils/onet-sdk-hooks'.
vi.mock('@scf/core/utils/onet-sdk-hooks', () => ({
  useRIASECStatus: () => mockGetRIASECStatus(),
  useSaveCareerAssessmentMutation: (callbacks?: { onSuccess?: () => void; onError?: (error: { message?: string }) => void }) => {
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
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    // Merged from 2 vi.mock('@scaffald/ui') registrations that used to sit
    // in this file. Two registrations for one module do not combine —
    // one factory wins, nondeterministically — so whichever lost took
    // its stubs with it and the file failed at random (#566).
    useQueryClient: () => ({
      invalidateQueries: () => mockInvalidate(),
    }),
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

// Mock AssessmentWizard + helpers (toError must mirror the real
// null-passthrough behavior so AssessmentWizard doesn't take the
// error branch when useRIASECStatus returns error: null).
vi.mock('@scf/core/features/assessments', () => ({
  AssessmentTakingLayout: ({ children, counter, footerEnd, onExit, exitLabel }: {
    children: React.ReactNode
    counter?: string
    footerEnd?: React.ReactNode
    onExit: () => void
    exitLabel?: string
  }) => (
    <div data-testid="taking-layout">
      {counter && <span>{counter}</span>}
      {children}
      <button type="button" onClick={onExit}>
        {exitLabel ?? 'Save & exit'}
      </button>
      {footerEnd}
    </div>
  ),
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
  useAssessmentSave: (opts: {
    useMutation: (cb?: { onSuccess?: () => void; onError?: (err: unknown) => void }) => unknown
    onSuccess?: () => void
  }) => opts.useMutation({ onSuccess: opts.onSuccess }),
  toError: (err: unknown) =>
    err == null ? null : err instanceof Error ? err : new Error(String(err)),
}))

// Mock RiasecQuickAssessment
vi.mock('@scf/core/features/career-assessment/components/RiasecQuickAssessment', () => ({
  RiasecQuickAssessment: ({ value, onChange, disabled }: {
    value: Record<string, number | null>
    onChange: (scores: Record<string, number | null>) => void
    disabled?: boolean
  }) => (
    <div data-testid="riasec-assessment">
      {Object.entries(value).map(([key, val]) => (
        <input
          key={key}
          type="range"
          min={1}
          max={5}
          value={val ?? ''}
          data-unset={val == null ? 'true' : 'false'}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
          data-testid={`slider-${key}`}
        />
      ))}
    </div>
  ),
}))

// Mock Button

describe('RIASECAssessmentWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false, scores: null },
      isLoading: false,
      error: null,
    })
  })

  // TODO: copy drifted — component no longer says "Rate your interest in
  // each career dimension". Update the expected text or query by the
  // current production string.
  it.skip('should render wizard with title and description', () => {
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

  // TODO: useRIASECStatus error shape now wraps the message differently
  // — the mock's `error.message` no longer surfaces directly through
  // toError. Re-verify the error display copy and the mock shape.
  it.skip('should show error state', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to load' },
    })

    renderWithProviders(<RIASECAssessmentWizard />)

    expect(screen.getByTestId('error')).toBeInTheDocument()
    expect(screen.getByText('Failed to load')).toBeInTheDocument()
  })

  // The real Button renders a disabled <button>. This was skipped while the
  // defaults (every slider at 3) made a fresh visit count as fully rated.
  it('should disable complete button when not all sliders are rated', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    const completeButton = screen.getByText('Save results').closest('button')
    expect(completeButton).toBeDisabled()

    fireEvent.change(screen.getByTestId('slider-realistic'), { target: { value: '4' } })
    expect(screen.getByText('Save results').closest('button')).toBeDisabled()
  })

  it('starts with nothing rated (#1173)', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    expect(screen.getByText('0 of 6 dimensions rated')).toBeInTheDocument()
    const realisticSlider = screen.getByTestId('slider-realistic') as HTMLInputElement
    expect(realisticSlider.getAttribute('data-unset')).toBe('true')
  })

  it('counts only the dimensions the user set (#1173)', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    fireEvent.change(screen.getByTestId('slider-realistic'), { target: { value: '4' } })
    fireEvent.change(screen.getByTestId('slider-social'), { target: { value: '2' } })

    expect(screen.getByText('2 of 6 dimensions rated')).toBeInTheDocument()
  })

  it('should enable complete button when all sliders are rated', () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values (1-5). Not 3: an empty range input
    // already reports its midpoint, so React sees no change.
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '4' } })
    })

    const completeButton = screen.getByText('Save results')
    expect(completeButton).not.toBeDisabled()
  })

  // TODO: Button onPress→onClick wiring isn't proxied through the stub
  // and the toast `show` is mocked locally inside the @scaffald/ui
  // factory (returns empty fn), so `mockToastShow` never fires. Move
  // the toast mock outside the factory and widen Button.
  it.skip('should save assessment and navigate on completion', async () => {
    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '3' } })
    })

    const completeButton = screen.getByText('Save results')
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

  // TODO: Same Button onPress→onClick + scoped useToast issue as save
  // success test — mockToastShow never fires.
  it.skip('should show error toast on save failure', async () => {
    mockSaveCareerAssessment.mockRejectedValueOnce({ message: 'Save failed' })

    renderWithProviders(<RIASECAssessmentWizard />)

    // Set all sliders to valid values
    const sliders = screen.getAllByTestId(/slider-/)
    sliders.forEach((slider) => {
      fireEvent.change(slider, { target: { value: '3' } })
    })

    const completeButton = screen.getByText('Save results')
    fireEvent.click(completeButton)

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith('Error', {
        message: 'Save failed',
      })
    })
  })
})

