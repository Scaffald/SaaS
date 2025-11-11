import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { spacing } from '../../../config/spacing'
import { typography } from '../../../config/typography'

const stackPropsLog = vi.hoisted(() => [] as Array<Record<string, unknown>>)
const textPropsLog = vi.hoisted(() => [] as Array<Record<string, unknown>>)

vi.mock('tamagui', () => ({
  YStack: ({ children, ...rest }: { children?: ReactNode }) => {
    stackPropsLog.push(rest)
    return <div data-testid={rest['data-testid'] ?? 'ystack'}>{children}</div>
  },
  Text: ({ children, ...rest }: { children?: ReactNode }) => {
    textPropsLog.push(rest)
    const { lineHeight, style, ...other } = rest as Record<string, unknown>
    const mergedStyle =
      lineHeight !== undefined
        ? { ...(style as Record<string, unknown> | undefined), lineHeight }
        : (style as Record<string, unknown> | undefined)

    return (
      <p data-testid={rest['data-testid'] ?? 'text'} {...other} style={mergedStyle}>
        {children}
      </p>
    )
  },
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Inbox: ({ size, color }: { size: number; color: string }) => (
    <span data-testid="default-icon">{`${size}-${color}`}</span>
  ),
}))

const { EmptyState } = await import('../EmptyState')

describe('EmptyState', () => {
  beforeEach(() => {
    stackPropsLog.length = 0
    textPropsLog.length = 0
  })

  it('renders default icon and primary title with design tokens', () => {
    render(<EmptyState title="Nothing here" />)

    expect(screen.getByTestId('default-icon')).toHaveTextContent('48-$color9')
    expect(screen.getByText('Nothing here')).toBeInTheDocument()

    const outerStack = stackPropsLog[0]
    expect(outerStack).toMatchObject({
      flex: 1,
      items: 'center',
      justify: 'center',
      gap: spacing.md,
      p: spacing['2xl'],
    })
  })

  it('supports custom icon, description, and action', () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">CI</span>}
        title="No results"
        description="Try adjusting your filters."
        action={<button type="button">Reset</button>}
      />
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()

    const descriptionProps = textPropsLog.find((props) => props.color === '$color10')
    expect(descriptionProps).toMatchObject({
      lineHeight: typography.lineHeightRelaxed,
      style: expect.objectContaining({ maxWidth: 400 }),
    })

    const actionStack = stackPropsLog.find((props) => props.mt === spacing.md)
    expect(actionStack).toBeDefined()
  })
})
