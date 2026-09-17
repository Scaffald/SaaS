import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', () => ({
  useBottomBarContext: () => ({ navBarHeight: 0, setNavBarHeight: () => {} }),
}))

import { ScreenScroll } from '../ScreenScroll'

/**
 * The document already scrolls on web; adding a ScrollView there would nest
 * a second scroller inside every Office page (#796 acceptance).
 */
describe('ScreenScroll on web', () => {
  it('renders the screen unchanged', () => {
    render(
      <ScreenScroll>
        <span>page</span>
      </ScreenScroll>
    )
    expect(screen.getByText('page')).toBeInTheDocument()
    expect(screen.queryByTestId('screen-scroll')).toBeNull()
  })
})
