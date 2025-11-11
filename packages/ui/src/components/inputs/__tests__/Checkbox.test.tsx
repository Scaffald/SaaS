import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

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
  const View = ({
    children,
    onPress,
    testID,
    ...rest
  }: { children?: ReactNode; onPress?: () => void; testID?: string }) => (
    <div
      data-testid={testID}
      role={rest.role as string | undefined}
      aria-checked={rest['aria-checked'] as boolean | undefined}
      aria-disabled={rest['aria-disabled'] as boolean | undefined}
      onClick={onPress}
      {...rest}
    >
      {children}
    </div>
  )

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
