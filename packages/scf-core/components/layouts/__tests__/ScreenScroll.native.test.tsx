import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * On a phone an Office screen rooted in a plain Stack has no way to reach
 * anything below the fold (#796). The navigator wraps every screen in a
 * ScrollView whose content grows to the viewport, so `flex: 1` roots fill
 * it and taller ones scroll.
 */
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return { ...(actual as object), Platform: { OS: 'ios' } }
})

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}))

vi.mock('@scaffald/ui', () => ({
  useBottomBarContext: () => ({ navBarHeight: 64, setNavBarHeight: () => {} }),
}))

import { ScreenScroll, scrollingScreenLayout, shouldWrapScreenInScroll } from '../ScreenScroll'

describe('ScreenScroll on native', () => {
  it('wraps the screen in a ScrollView', () => {
    render(
      <ScreenScroll>
        <span>storage table</span>
      </ScreenScroll>
    )
    const scroller = screen.getByTestId('screen-scroll')
    expect(scroller.contains(screen.getByText('storage table'))).toBe(true)
  })

  it('grows the content to the viewport and clears the bottom nav', () => {
    render(
      <ScreenScroll>
        <span>content</span>
      </ScreenScroll>
    )
    const content = screen.getByText('content').parentElement as HTMLElement
    expect(content.style.flexGrow).toBe('1')
    // 64 nav bar + 34 home indicator inset
    expect(content.style.paddingBottom).toBe('98px')
  })

  it('is the shape a navigator screenLayout expects', () => {
    render(scrollingScreenLayout({ children: <span>screen</span> }))
    expect(screen.getByTestId('screen-scroll')).toBeInTheDocument()
  })

  it('never wraps on web, where the document scrolls', () => {
    expect(shouldWrapScreenInScroll('web')).toBe(false)
    expect(shouldWrapScreenInScroll('ios')).toBe(true)
    expect(shouldWrapScreenInScroll('android')).toBe(true)
  })
})
