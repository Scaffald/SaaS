import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CSSProperties, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const mapStyleProps = (props: Record<string, unknown>) => {
    const styleProps: Record<string, unknown> = {
      ...(props.style as Record<string, unknown> | undefined),
    }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
      // Handle responsive props - in test environment, assume $md applies
      if (key === '$md' && typeof value === 'object' && value !== null) {
        const responsiveProps = value as Record<string, unknown>
        if ('r' in responsiveProps) {
          styleProps.right = responsiveProps.r
        }
        continue
      }
      switch (key) {
        case 'position':
        case 'px':
        case 'py':
        case 'gap':
        case 'justify':
        case 'items':
        case 'b':
          styleProps.bottom = value
          break
        case 'l':
          styleProps.left = value
          break
        case 'r':
          styleProps.right = value
          break
        case 't':
          styleProps.top = value
          break
        case 'rounded':
          styleProps.borderRadius = value
          break
        case 'borderWidth':
        case 'borderColor':
        case 'shadowColor':
        case 'shadowOffset':
        case 'shadowOpacity':
        case 'shadowRadius':
        case 'opacity':
        case 'z':
        case 'animation':
        case 'x':
        case 'hoverStyle':
        case 'pressStyle':
        case 'scaleIcon':
        case 'variant':
        case 'circular':
        case 'icon':
        case 'color':
        case 'size':
        case 'flex':
        case 'flexBasis':
        case 'maxW':
        case 'overflow':
        case 'borderLeftWidth': {
          styleProps[key] = value
          break
        }
        default: {
          passthrough[key] = value
        }
      }
    }
    return { style: styleProps, passthrough } as const
  }

  const MockButton = ({
    children,
    onPress,
    ...rest
  }: {
    children: ReactNode
    onPress?: () => void
    style?: CSSProperties
  }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <button type="button" onClick={onPress} style={style} {...passthrough}>
        {children}
      </button>
    )
  }

  const MockXStack = ({ children, ...rest }: { children: ReactNode; style?: CSSProperties }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <div data-testid="x-stack" style={style} {...passthrough}>
        {children}
      </div>
    )
  }

  return {
    ...actual,
    XStack: MockXStack,
    Button: MockButton,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Search: () => <span data-testid="icon-search" />,
  SlidersHorizontal: () => <span data-testid="icon-filters" />,
  RotateCcw: () => <span data-testid="icon-reset" />,
  List: () => <span data-testid="icon-list" />,
}))

const { FilterBar } = await import('../FilterBar')

describe('FilterBar', () => {
  it('calls handlers when buttons pressed and toggles states', async () => {
    const searchHandler = vi.fn()
    const filterHandler = vi.fn()
    const resetHandler = vi.fn()
    const resultsHandler = vi.fn()
    const user = userEvent.setup()

    render(
      <FilterBar
        onSearchPress={searchHandler}
        onFilterPress={filterHandler}
        onResetPress={resetHandler}
        onResultsPress={resultsHandler}
        resultsCount={12}
        searchActive
        filterActive
      />
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    await user.click(buttons[0])
    await user.click(buttons[1])
    await user.click(buttons[2])
    await user.click(buttons[3])

    expect(resultsHandler).toHaveBeenCalledTimes(1)
    expect(searchHandler).toHaveBeenCalledTimes(1)
    expect(filterHandler).toHaveBeenCalledTimes(1)
    expect(resetHandler).toHaveBeenCalledTimes(1)
  })

  it('renders icon when no results count and shifts rail width when results rail visible', () => {
    render(<FilterBar resultsCount={0} railVisible />)

    expect(screen.getByTestId('icon-list')).toBeInTheDocument()
    const container = screen.getAllByTestId('x-stack')[0]
    expect(container.style.right).toBe('440px')
  })
})
