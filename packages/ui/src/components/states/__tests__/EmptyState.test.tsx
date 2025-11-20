import { render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { spacing } from '../../../config/spacing'
import { typography } from '../../../config/typography'

const stackPropsLog = vi.hoisted(() => [] as Array<Record<string, unknown>>)
const textPropsLog = vi.hoisted(() => [] as Array<Record<string, unknown>>)

vi.mock('tamagui', () => {
  interface MockStackProps extends Record<string, unknown> {
    children?: ReactNode
    'data-testid'?: string
  }

  interface MockTextProps extends Record<string, unknown> {
    children?: ReactNode
    lineHeight?: number | string
    style?: CSSProperties
    'data-testid'?: string
  }

  return {
    YStack: ({ children, 'data-testid': dataTestId, ...rest }: MockStackProps) => {
      stackPropsLog.push(rest)
      return (
        <div
          data-testid={dataTestId ?? 'ystack'}
          {...(rest as Record<string, string | number | boolean | undefined>)}
        >
          {children}
        </div>
      )
    },
    Text: ({ children, lineHeight, style, 'data-testid': dataTestId, ...rest }: MockTextProps) => {
      const loggedProps = {
        lineHeight,
        style,
        ...rest,
      }
      textPropsLog.push(loggedProps)

      const mergedStyle: CSSProperties | undefined =
        lineHeight !== undefined ? { ...(style ?? {}), lineHeight } : style

      return (
        <p
          data-testid={dataTestId ?? 'text'}
          {...(rest as Record<string, string | number | boolean | undefined>)}
          style={mergedStyle}
        >
          {children}
        </p>
      )
    },
  }
})

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
