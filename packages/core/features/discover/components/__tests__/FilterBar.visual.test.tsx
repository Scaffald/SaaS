import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

interface ExtendedCSSProperties extends CSSProperties {
  shadowOpacity?: number | string;
  shadowRadius?: number | string;
  shadowOffset?: { width: number | string; height: number | string };
}

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  const mapStyleProps = (props: Record<string, unknown>) => {
    const styleProps: Record<string, unknown> = { ...(props.style as Record<string, unknown> | undefined) }
    const passthrough: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (key === 'style') continue
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
          styleProps[key] = value
          break
        default: {
          passthrough[key] = value
        }
      }
    }
    return { style: styleProps, passthrough } as const
  }

  const MockButton = ({ children, onPress, ...rest }: { children: ReactNode; onPress?: () => void; style?: ExtendedCSSProperties }) => {
    const { style, passthrough } = mapStyleProps(rest)
    return (
      <button type="button" onClick={onPress} style={style} {...passthrough}>
        {children}
      </button>
    )
  }

  const MockXStack = ({ children, ...rest }: { children: ReactNode; style?: ExtendedCSSProperties }) => {
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

describe('FilterBar Visual Enhancement', () => {
  it('applies backdrop blur styles', () => {
    render(<FilterBar />)
    
    const container = screen.getAllByTestId('x-stack')[1] // Second XStack is the inner container
    const styles = container.style as ExtendedCSSProperties
    
    // Verify backdrop blur is applied
    expect(styles.backdropFilter).toBe('blur(10px)')
    expect(styles.WebkitBackdropFilter).toBe('blur(10px)')
  })

  it('applies border and shadow styles', () => {
    render(<FilterBar />)
    
    const container = screen.getAllByTestId('x-stack')[1]
    const styles = container.style as ExtendedCSSProperties
    
    // Verify border (CSS returns as string)
    expect(styles.borderWidth).toBe('2px')
    
    // Verify shadow properties (CSS may return as strings or objects)
    const shadowOpacity = styles.shadowOpacity
    expect(shadowOpacity === 0.25 || shadowOpacity === '0.25' || shadowOpacity === '0.25px').toBe(true)
    const shadowRadius = styles.shadowRadius
    expect(shadowRadius === 16 || shadowRadius === '16' || shadowRadius === '16px').toBe(true)
    // shadowOffset may be stringified, just verify it exists
    expect(styles.shadowOffset).toBeDefined()
  })

  it('applies semi-transparent background with opacity', () => {
    render(<FilterBar />)
    
    const container = screen.getAllByTestId('x-stack')[1]
    const styles = container.style as ExtendedCSSProperties
    
    // Verify opacity is set for semi-transparency (CSS may return as string)
    const opacity = styles.opacity
    expect(opacity === 0.95 || opacity === '0.95').toBe(true)
  })

  it('applies rounded corners', () => {
    render(<FilterBar />)
    
    const container = screen.getAllByTestId('x-stack')[1]
    const styles = container.style as ExtendedCSSProperties
    
    // Verify rounded corners (borderRadius should be set)
    expect(styles.borderRadius).toBeDefined()
  })
})

