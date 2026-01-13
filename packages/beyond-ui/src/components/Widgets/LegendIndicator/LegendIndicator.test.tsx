/**
 * LegendIndicator component tests
 */

import { render } from '@testing-library/react-native'
import { LegendIndicator } from './LegendIndicator'

describe('LegendIndicator', () => {
  it('renders horizontal legend by default', () => {
    const items = [
      { label: 'Series 1', color: '#3b82f6' },
      { label: 'Series 2', color: '#10b981' },
    ]

    const { getByText } = render(<LegendIndicator items={items} />)

    expect(getByText('Series 1')).toBeTruthy()
    expect(getByText('Series 2')).toBeTruthy()
  })

  it('renders vertical legend when orientation is vertical', () => {
    const items = [{ label: 'Series 1', color: '#3b82f6' }]

    const { getByText } = render(<LegendIndicator items={items} orientation="vertical" />)

    expect(getByText('Series 1')).toBeTruthy()
  })
})
