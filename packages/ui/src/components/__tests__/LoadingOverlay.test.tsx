import { describe, expect, test } from 'vitest'

import { LoadingOverlay } from '../LoadingOverlay'
import { render, screen } from '../../../test/test-utils'

describe('LoadingOverlay', () => {
  test('renders a fullscreen overlay with loading content', () => {
    render(<LoadingOverlay aria-label="Loading content" data-testid="loading-overlay" />)

    const overlay = screen.getByTestId('loading-overlay')
    expect(overlay).toHaveAttribute('aria-label', 'Loading content')
    expect(overlay).toHaveStyle({ position: 'absolute' })
    expect(overlay.childElementCount).toBeGreaterThan(0)
  })

  test('allows additional props to be passed through', () => {
    render(<LoadingOverlay aria-hidden="true" data-testid="custom-overlay"></LoadingOverlay>)

    const overlay = screen.getByTestId('custom-overlay')
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
  })
})
