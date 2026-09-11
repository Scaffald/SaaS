import type { IPIPScores } from '@scf/core/features/personality-assessment/lib/ipip'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IPIPResultsPage } from '../IPIPResultsPage'
import { TestQueryWrapper } from '@test-helpers/test-utils'

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
const awardMutate = vi.fn()

// Component now uses personality-assessment-sdk-hooks +
// @tanstack/react-query useQueryClient.
//
// Like the real useMutation, this returns a NEW object on every call with a
// stable `mutate`. A single shared object would hide #740: the effect that
// depended on the object identity only loops when the identity changes.
vi.mock('@scf/core/utils/personality-assessment-sdk-hooks', () => ({
  useAwardResultsViewXPMutation: () => ({ mutate: awardMutate }),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({
      // Production code invalidates ['personality-assessment', 'status'] /
      // ['personality-assessment', 'archetype']. Map by the second key.
      invalidateQueries: (opts: { queryKey?: unknown[] }) => {
        const second = opts.queryKey?.[1]
        if (second === 'status') invalidateAssessment()
        else if (second === 'archetype') invalidateArchetype()
      },
    }),
  }
})

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
    awardMutate.mockClear()
  })

  it('renders a loading state while queries run', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      isLoading: true,
    })

    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/Loading your results/i)).toBeVisible()
  })

  it('shows error UI with retry controls when a fatal error occurs', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      error: new Error('Network down'),
      hasPartialResults: false,
    })

    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/Error Loading Results/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    expect(invalidateAssessment).toHaveBeenCalled()
    expect(invalidateArchetype).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Return to Dashboard/i }))
    expect(mockPush).toHaveBeenCalled()
  })

  it('renders the empty state when no answers have been saved yet', () => {
    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/No Results Yet/i)).toBeVisible()
    expect(screen.queryByTestId('narrative-view')).not.toBeInTheDocument()
  })

  it('does not award XP while results are incomplete', () => {
    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

    expect(awardMutate).not.toHaveBeenCalled()
  })

  // #740: the award effect depended on the mutation object, which useMutation
  // recreates every render, so mutate() re-triggered itself indefinitely.
  it('awards XP exactly once, however many times the page re-renders', () => {
    mockUseIPIPResults.mockReturnValue({
      ...baseResults,
      scores: {} as IPIPScores,
      normalizedScores: null,
      narratives: null,
      isComplete: true,
      completedDomains: 5,
    })

    const view = render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })
    view.rerender(<IPIPResultsPage />)
    view.rerender(<IPIPResultsPage />)
    // Switching tabs re-renders through state, the way a user would.
    fireEvent.click(screen.getByText('Chart View'))

    expect(awardMutate).toHaveBeenCalledTimes(1)
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

    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

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

    render(<IPIPResultsPage />, { wrapper: TestQueryWrapper })

    expect(awardMutate).toHaveBeenCalled()
    expect(screen.getByTestId('share-results')).toHaveTextContent('share-enabled')
  })
})
