import type { IPIPScore, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { NormalizedScores } from '../../utils/scoreNormalizer'

import { ChartView } from '../ChartView'

vi.mock('@unicornlove/ui', () => ({
  __esModule: true as const,
  SkillsChart: (props: { datasets: { data: unknown[] }[] }) => (
    <div data-testid="skills-chart">points:{props.datasets[0]?.data?.length ?? 0}</div>
  ),
  BarChart: (props: { data: unknown[]; domain?: string }) => (
    <div data-testid={`bar-chart-${props.data?.length ?? 0}`}>{props.domain}</div>
  ),
}))

vi.mock('@tamagui/visually-hidden', () => ({
  VisuallyHidden: ({ children }: { children: ReactNode }) => (
    <div data-testid="sr-only">{children}</div>
  ),
}))

const createDomainScore = (result: IPIPScore['result']): IPIPScore => ({
  score: result === 'high' ? 96 : result === 'low' ? 24 : 72,
  count: 24,
  result,
  facet: {
    1: { score: 12, count: 3, result },
    2: { score: 12, count: 3, result },
    3: { score: 12, count: 3, result },
    4: { score: 12, count: 3, result },
    5: { score: 12, count: 3, result },
    6: { score: 12, count: 3, result },
  },
})

const createScores = (): IPIPScores => ({
  A: createDomainScore('high'),
  E: createDomainScore('neutral'),
  N: createDomainScore('low'),
  C: createDomainScore('high'),
  O: createDomainScore('high'),
})

const createNormalizedScores = (): NormalizedScores => ({
  A: { percentage: 75, average: 4, result: 'high' },
  E: { percentage: 50, average: 3, result: 'neutral' },
  N: { percentage: 25, average: 2, result: 'low' },
  C: { percentage: 80, average: 4.2, result: 'high' },
  O: { percentage: 85, average: 4.4, result: 'high' },
})

describe('ChartView', () => {
  it('shows an empty state when no scores are available', () => {
    render(
      <ChartView
        scores={null}
        normalizedScores={null}
        archetype={null}
        isComplete={false}
        completedDomains={0}
      />
    )

    expect(screen.getByText(/No chart data available yet/i)).toBeVisible()
  })

  it('renders radar, facet charts, and archetype badge for completed assessments', () => {
    render(
      <ChartView
        scores={createScores()}
        normalizedScores={createNormalizedScores()}
        archetype={{ archetype: 'Connector', name: 'Connector', confidence: 82 }}
        isComplete
        completedDomains={5}
      />
    )

    expect(screen.getByText('Your Archetype')).toBeVisible()
    expect(screen.getByText('Connector')).toBeVisible()
    expect(screen.getByTestId('skills-chart')).toHaveTextContent('points:5')
    expect(screen.getAllByTestId(/bar-chart-/i)).toHaveLength(5)
    expect(screen.getByText(/Big Five Personality Traits/i)).toBeVisible()
  })
})
