import { fireEvent, render, screen } from '@testing-library/react'
import type { IPIPResult, IPIPScore } from '@app/core/features/personality-assessment/lib/ipip'
import { describe, expect, it } from 'vitest'

import { DomainCard } from '../DomainCard'

const createScore = (): IPIPScore => ({
  score: 96,
  count: 24,
  result: 'high',
  facet: {
    1: { score: 18, count: 3, result: 'high' },
    2: { score: 18, count: 3, result: 'high' },
    3: { score: 18, count: 3, result: 'high' },
    4: { score: 18, count: 3, result: 'high' },
    5: { score: 12, count: 3, result: 'neutral' },
    6: { score: 12, count: 3, result: 'neutral' },
  },
})

const createNarrative = (): IPIPResult => ({
  title: 'Agreeableness',
  summary: 'You enjoy supporting people.',
  description: 'Long-form description',
  results: {
    low: { text: 'Low agreeable' },
    neutral: { text: 'Moderately agreeable' },
    high: { text: 'Your high level of Agreeableness indicates care for others.' },
  },
  facets: {
    1: { title: 'Trust', text: 'You default to trust.' },
    2: { title: 'Morality', text: 'You value honesty.' },
    3: { title: 'Altruism', text: 'You help others.' },
    4: { title: 'Cooperation', text: 'You avoid conflict.' },
    5: { title: 'Modesty', text: 'You stay humble.' },
    6: { title: 'Sympathy', text: 'You empathize easily.' },
  },
})

describe('DomainCard', () => {
  it('renders a locked state when the domain is incomplete', () => {
    render(
      <DomainCard
        domain="A"
        score={null}
        normalizedScore={null}
        narrative={null}
        isComplete={false}
      />,
    )

    expect(screen.getByText('Agreeableness')).toBeVisible()
    expect(screen.getByText(/Complete Agreeableness questions/i)).toBeVisible()
    expect(screen.queryByText(/Show Facets/i)).not.toBeInTheDocument()
  })

  it('shows classification, percentages, and facet details when complete', () => {
    render(
      <DomainCard
        domain="A"
        score={createScore()}
        normalizedScore={75}
        narrative={createNarrative()}
        isComplete
      />,
    )

    expect(screen.getByText('Agreeableness')).toBeVisible()
    expect(screen.getByText('HIGH')).toBeVisible()
    expect(screen.getByText('75%')).toBeVisible()
    expect(screen.getByText(/Your high level of Agreeableness/i)).toBeVisible()

    const toggle = screen.getByRole('button', { name: /Show Facets/i })
    fireEvent.click(toggle)

    expect(screen.getByText('Trust')).toBeVisible()
    expect(screen.getByText('You default to trust.')).toBeVisible()
    expect(screen.getByRole('button', { name: /Hide Facets/i })).toBeVisible()
  })
})


