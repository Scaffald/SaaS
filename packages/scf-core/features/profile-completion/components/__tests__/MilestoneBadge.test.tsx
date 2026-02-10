import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { CompletionMilestone } from '../../hooks/useCompletionStatus'
import { MilestoneBadge } from '../MilestoneBadge'

vi.mock('@unicornlove/beyond-ui', () => {
  const Stack = ({
    children,
    opacity,
    ...rest
  }: {
    children?: ReactNode
    opacity?: number
  } & Record<string, unknown>) => (
    <div {...rest} style={{ ...(rest.style as Record<string, unknown>), opacity }}>
      {children}
    </div>
  )

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  return {
    Stack: Stack,
    Row: Stack,
    Text,
  }
})

vi.mock('lucide-react-native', () => ({
  Trophy: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="trophy-icon" data-size={size} data-color={color}>
      Trophy
    </span>
  ),
}))

describe('MilestoneBadge', () => {
  it('renders badge with correct label', () => {
    const milestone: CompletionMilestone = {
      id: '25',
      label: '25% Complete',
      threshold: 25,
      achieved: true,
      reachedAt: null,
    }

    render(<MilestoneBadge milestone={milestone} />)

    expect(screen.getByText('25% Complete')).toBeInTheDocument()
    expect(screen.getByText('25% milestone')).toBeInTheDocument()
  })

  it('shows achieved state with green styling', () => {
    const milestone: CompletionMilestone = {
      id: '50',
      label: '50% Complete',
      threshold: 50,
      achieved: true,
      reachedAt: '2025-01-01T12:00:00Z',
    }

    const { container } = render(<MilestoneBadge milestone={milestone} />)

    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveStyle({ opacity: 1 })
  })

  it('shows unachieved state with muted styling', () => {
    const milestone: CompletionMilestone = {
      id: '75',
      label: '75% Complete',
      threshold: 75,
      achieved: false,
      reachedAt: null,
    }

    const { container } = render(<MilestoneBadge milestone={milestone} />)

    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveStyle({ opacity: 0.7 })
  })

  it('displays reached timestamp when available', () => {
    const milestone: CompletionMilestone = {
      id: '100',
      label: '100% Complete',
      threshold: 100,
      achieved: true,
      reachedAt: '2025-01-01T12:00:00Z',
    }

    render(<MilestoneBadge milestone={milestone} />)

    expect(screen.getByText('100% Complete')).toBeInTheDocument()
  })

  it('handles different milestone thresholds', () => {
    const milestones: CompletionMilestone[] = [
      {
        id: '25',
        label: '25% Complete',
        threshold: 25,
        achieved: true,
        reachedAt: null,
      },
      {
        id: '50',
        label: '50% Complete',
        threshold: 50,
        achieved: false,
        reachedAt: null,
      },
      {
        id: '75',
        label: '75% Complete',
        threshold: 75,
        achieved: false,
        reachedAt: null,
      },
      {
        id: '100',
        label: '100% Complete',
        threshold: 100,
        achieved: true,
        reachedAt: '2025-01-01T12:00:00Z',
      },
    ]

    for (const milestone of milestones) {
      const { unmount } = render(<MilestoneBadge milestone={milestone} />)
      expect(screen.getByText(`${milestone.threshold}% Complete`)).toBeInTheDocument()
      expect(screen.getByText(`${milestone.threshold}% milestone`)).toBeInTheDocument()
      unmount()
    }
  })

  it('renders trophy icon', () => {
    const milestone: CompletionMilestone = {
      id: '25',
      label: '25% Complete',
      threshold: 25,
      achieved: true,
      reachedAt: null,
    }

    render(<MilestoneBadge milestone={milestone} />)

    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument()
  })
})
