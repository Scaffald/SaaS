import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const styledCalls = vi.hoisted(() => [] as Array<Record<string, unknown>>)
const platformState = vi.hoisted(() => ({ OS: 'web' }))

vi.mock('react-native', () => ({
  Platform: platformState,
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Check: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="check-icon" data-size={size} data-color={color} />
  ),
}))

vi.mock('tamagui', () => {
  interface MockViewProps extends Record<string, unknown> {
    children?: ReactNode
    onPress?: () => void
    testID?: string
    role?: string
    'aria-checked'?: boolean
    'aria-disabled'?: boolean
  }

  const View = ({
    children,
    onPress,
    testID,
    role,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    ...rest
  }: MockViewProps) => {
    const isCheckbox = role === 'checkbox' || !role
    if (isCheckbox && onPress) {
      return (
        <button
          type="button"
          data-testid={testID}
          role="checkbox"
          aria-checked={ariaChecked}
          aria-disabled={ariaDisabled}
          onClick={onPress}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && onPress) {
              e.preventDefault()
              onPress()
            }
          }}
          {...(rest as Record<string, string | number | boolean | undefined>)}
        >
          {children}
        </button>
      )
    }
    return (
      <div
        data-testid={testID}
        role={role || 'checkbox'}
        aria-checked={ariaChecked}
        aria-disabled={ariaDisabled}
        tabIndex={onPress ? 0 : undefined}
        onClick={onPress}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onPress) {
            e.preventDefault()
            onPress()
          }
        }}
        {...(rest as Record<string, string | number | boolean | undefined>)}
      >
        {children}
      </div>
    )
  }

  const styled = (Component: (props: any) => ReactNode, config: Record<string, unknown>) => {
    styledCalls.push(config)
    return ({ children, ...rest }: { children?: ReactNode }) => (
      <Component {...rest}>{children}</Component>
    )
  }

  return {
    View,
    styled,
  }
})

const { Checkbox } = await import('../Checkbox')

describe('Checkbox', () => {
  beforeEach(() => {
    platformState.OS = 'web'
  })

  it('toggles value on press when enabled', () => {
    const onCheckedChange = vi.fn()

    render(<Checkbox checked onCheckedChange={onCheckedChange} testID="checkbox" />)

    const element = screen.getByTestId('checkbox')
    expect(element).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(element)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('does not toggle when disabled', () => {
    const onCheckedChange = vi.fn()

    render(
      <Checkbox
        checked={false}
        disabled
        onCheckedChange={onCheckedChange}
        testID="checkbox-disabled"
      />
    )

    const element = screen.getByTestId('checkbox-disabled')
    expect(element).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(element)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('applies accessibility props on native platforms', () => {
    platformState.OS = 'ios'
    const onCheckedChange = vi.fn()

    render(
      <Checkbox
        checked
        onCheckedChange={onCheckedChange}
        testID="native-checkbox"
        ariaLabel="Accept"
      />
    )

    const element = screen.getByTestId('native-checkbox')
    expect(element.getAttribute('accessibilityrole')).toBe('checkbox')
    expect(element.getAttribute('accessibilitylabel')).toBe('Accept')
  })
})
