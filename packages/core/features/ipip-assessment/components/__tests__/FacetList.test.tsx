import { render, screen } from '@testing-library/react'
import type { IPIPFacetScore, IPIPResultFacets } from '@app/core/features/personality-assessment/lib/ipip'
import { describe, expect, it } from 'vitest'

import { FacetList } from '../FacetList'

const facets: Record<string, IPIPFacetScore> = {
  1: { score: 15, count: 3, result: 'high' },
  2: { score: 9, count: 3, result: 'neutral' },
  3: { score: 6, count: 3, result: 'low' },
  4: { score: 12, count: 3, result: 'high' },
  5: { score: 12, count: 3, result: 'neutral' },
  6: { score: 9, count: 3, result: 'low' },
}

const facetNarratives: IPIPResultFacets = {
  1: { title: 'Trust', text: 'You default to trust.' },
  2: { title: 'Morality', text: 'You value honesty.' },
  3: { title: 'Altruism', text: 'You help others.' },
  4: { title: 'Cooperation', text: 'You collaborate.' },
  5: { title: 'Modesty', text: 'You avoid bragging.' },
  6: { title: 'Sympathy', text: 'You empathize.' },
}

describe('FacetList', () => {
  it('renders facet titles, narratives, and result labels', () => {
    render(<FacetList facets={facets} facetNarratives={facetNarratives} />)

    expect(screen.getByText('Trust')).toBeVisible()
    expect(screen.getByText('You default to trust.')).toBeVisible()
    expect(screen.getAllByText('HIGH')).toHaveLength(2)
    expect(screen.getAllByText('NEUTRAL')).toHaveLength(2)
    expect(screen.getAllByText('LOW')).toHaveLength(2)
  })
})


