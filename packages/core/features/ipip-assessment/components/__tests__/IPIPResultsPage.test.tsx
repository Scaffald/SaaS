import { fireEvent, render, screen } from '@testing-library/react'
import type { IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IPIPResultsPage } from '../IPIPResultsPage'

const mockPush = vi.fn()
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockUseIPIPResults = vi.fn()
vi.mock('../../hooks/useIPIPResults', () => ({
  useIPIPResults: () => mockUseIPIPResults(),
}))

vi.mock('../NarrativeView', () => ({
  NarrativeView: () => <div data-testid="narrative-view" />,
}))

vi.mock('../ChartView', () => ({
  ChartView: () => <div data-testid="chart-view" />,
}))

vi.mock('../ShareResults', () => ({
  ShareResults: ({ isComplete }: { isComplete: boolean }) => (
    <div data-testid="share-results">{isComplete ? 'share-enabled' : 'share-locked'}</div>
  ),
}))

const invalidateAssessment = vi.fn()
const invalidateArchetype = vi.fn()
const awardMutation = {
  mutate: vi.fn(),
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    personalityAssessment: {
      awardResultsViewXP: {
        useMutation: () => awardMutation,
      },
    },
    useUtils: () => ({
      personalityAssessment: {
        getAssessmentStatus: { invalidate: invalidateAssessment },
        getArchetype: { invalidate: invalidateArchetype },
      },
    }),
  },
}))

const baseResults = {
  scores: null as IPIPScores | null,
  normalizedScores: null,
  narratives: null,
  archetype: null,
  isComplete: false,
  completedDomains: 0,
  nextAvailableAt: null,
  isLoading: false,
  error: null,
  hasPartialResults: false,
  scoringError: null,
  normalizationError: null,
  narrativeError: null,
}

describe('IPIPResultsPage', () => {
  beforeEach(() => {
    mockUseIPIPResults.mockReturnValue({ ...baseResults })
    mockPush.mockClear()
    invalidateAssessment.mockClear()
    invalidateArchetype.mockClear()
    awardMutation.mutate.mockClear()
  })

  it('renders a loading state while queries run', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      isLoading: true,
    })

    render(<IPIPResultsPage />)

    expect(screen.getByText(/Loading your results/i)).toBeVisible()
  })

  it('shows error UI with retry controls when a fatal error occurs', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      error: new Error('Network down'),
      hasPartialResults: false,
    })

    render(<IPIPResultsPage />)

    expect(screen.getByText(/Error Loading Results/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    expect(invalidateAssessment).toHaveBeenCalled()
    expect(invalidateArchetype).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Return to Dashboard/i }))
    expect(mockPush).toHaveBeenCalled()
  })

  it('renders the empty state when no answers have been saved yet', () => {
    render(<IPIPResultsPage />)

    expect(screen.getByText(/No Results Yet/i)).toBeVisible()
    expect(screen.queryByTestId('narrative-view')).not.toBeInTheDocument()
  })

  it('renders the main layout, warnings, and share section when data is available', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      scores: {} as IPIPScores,
      normalizedScores: null,
      narratives: null,
      isComplete: true,
      completedDomains: 5,
      scoringError: new Error('calc failed'),
      hasPartialResults: true,
    })

    render(<IPIPResultsPage />)

    expect(screen.getByTestId('narrative-view')).toBeVisible()
    expect(screen.getByTestId('chart-view')).toBeVisible()
    expect(screen.getByTestId('share-results')).toHaveTextContent('share-enabled')
    expect(screen.getByText(/Partial Data Available/i)).toBeVisible()
    expect(screen.getByText(/Scoring calculation failed/i)).toBeVisible()
  })

  it('awards XP once results are complete', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      scores: {} as IPIPScores,
      normalizedScores: null,
      narratives: null,
      isComplete: true,
      completedDomains: 5,
    })

    render(<IPIPResultsPage />)

    expect(awardMutation.mutate).toHaveBeenCalled()
    expect(screen.getByTestId('share-results')).toHaveTextContent('share-enabled')
  })
})


