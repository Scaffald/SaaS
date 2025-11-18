import { render, screen } from '@testing-library/react'
import type {
  IPIPResult,
  IPIPResults,
  IPIPScores,
  IPIPScore,
} from '@app/core/features/personality-assessment/lib/ipip'
import type { NormalizedScores } from '../../utils/scoreNormalizer'
import { describe, expect, it } from 'vitest'

import { NarrativeView } from '../NarrativeView'

const buildDomainScore = (result: IPIPScore['result']): IPIPScore => ({
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
  A: buildDomainScore('high'),
  E: buildDomainScore('neutral'),
  N: buildDomainScore('low'),
  C: buildDomainScore('neutral'),
  O: buildDomainScore('high'),
})

const createNormalizedScores = (): NormalizedScores => ({
  A: { percentage: 75, average: 4, result: 'high' },
  E: { percentage: 50, average: 3, result: 'neutral' },
  N: { percentage: 50, average: 3, result: 'neutral' },
  C: { percentage: 50, average: 3, result: 'neutral' },
  O: { percentage: 50, average: 3, result: 'neutral' },
})

const createBlankResult = (): IPIPResult => ({
  title: '',
  summary: '',
  description: '',
  results: {
    low: { text: '' },
    neutral: { text: '' },
    high: { text: '' },
  },
  facets: {
    1: { title: '', text: '' },
    2: { title: '', text: '' },
    3: { title: '', text: '' },
    4: { title: '', text: '' },
    5: { title: '', text: '' },
    6: { title: '', text: '' },
  },
})

const narratives: IPIPResults = {
  A: {
    title: 'Agreeableness',
    summary: 'Agreeableness summary',
    description: 'Description',
    results: {
      low: { text: 'Low agreeable' },
      neutral: { text: 'Neutral agreeable' },
      high: { text: 'Your high level of Agreeableness indicates empathy.' },
    },
    facets: {
      1: { title: 'Trust', text: 'You trust others.' },
      2: { title: 'Morality', text: 'You value honesty.' },
      3: { title: 'Altruism', text: 'You lend a hand.' },
      4: { title: 'Cooperation', text: 'You avoid conflict.' },
      5: { title: 'Modesty', text: 'You stay humble.' },
      6: { title: 'Sympathy', text: 'You empathize.' },
    },
  },
  E: createBlankResult(),
  N: createBlankResult(),
  C: createBlankResult(),
  O: createBlankResult(),
}

describe('NarrativeView', () => {
  it('renders an empty state when no domains are complete', () => {
    render(
      <NarrativeView
        scores={null}
        normalizedScores={null}
        narratives={null}
        isComplete={false}
        completedDomains={0}
      />,
    )

    expect(screen.getByText(/No results available yet/i)).toBeVisible()
  })

  it('shows summaries, domain cards, and partial completion messaging', () => {
    render(
      <NarrativeView
        scores={createScores()}
        normalizedScores={createNormalizedScores()}
        narratives={narratives}
        isComplete={false}
        completedDomains={1}
      />,
    )

    expect(screen.getByText('Your Personality Profile')).toBeVisible()
    expect(
      screen.getByText(/Your high level of Agreeableness indicates empathy/i),
    ).toBeVisible()
    expect(screen.getByText(/Complete Your Assessment/i)).toBeVisible()
    expect(screen.getAllByText(/Incomplete/i).length).toBeGreaterThan(0)
  })
})


