import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cardShadows } from '../../../config/shadows'
import { spacing } from '../../../config/spacing'

const windowWidth = vi.hoisted(() => ({ current: 1024 }))
const themeBackground = vi.hoisted(() => ({ current: '#fff' }))
const cardPropsStore = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('tamagui', () => ({
  Card: ({ children, ...rest }: { children?: ReactNode }) => {
    cardPropsStore.current = rest
    return <div data-testid="dashboard-widget">{children}</div>
  },
  useTheme: () => ({
    background: { val: themeBackground.current },
  }),
  useMedia: () => ({
    sm: windowWidth.current <= 800,
  }),
}))

const { DashboardWidget } = await import('../DashboardWidget')

describe('DashboardWidget', () => {
  beforeEach(() => {
    windowWidth.current = 1024
    themeBackground.current = '#fff' // simulate light mode
    cardPropsStore.current = {}
  })

  it('renders child content and applies light theme shadows', () => {
    render(<DashboardWidget>Value</DashboardWidget>)

    expect(screen.getByTestId('dashboard-widget')).toHaveTextContent('Value')
    expect(cardPropsStore.current).toMatchObject({
      boxShadow: cardShadows.light,
      hoverStyle: { boxShadow: cardShadows.lightHover },
      gap: spacing.md,
      p: spacing.lg,
    })
  })

  it('switches to compact padding on small screens', () => {
    windowWidth.current = 320

    render(<DashboardWidget>Compact</DashboardWidget>)

    expect(cardPropsStore.current.p).toBe(spacing.xs)
  })

  it('uses dark elevated shadow styles when requested', () => {
    themeBackground.current = 'rgba(0,0,0,0.08%)' // trigger dark-mode heuristic

    render(
      <DashboardWidget elevated gap={spacing.lg}>
        Elevated
      </DashboardWidget>
    )

    expect(cardPropsStore.current.boxShadow).toBe(cardShadows.dark)
    expect(cardPropsStore.current.hoverStyle).toEqual({ boxShadow: cardShadows.darkHover })
    expect(cardPropsStore.current.gap).toBe(spacing.lg)
  })
})
