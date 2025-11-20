import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const styledCalls = vi.hoisted(() => [] as Array<{ config: Record<string, unknown> }>)

vi.mock('tamagui', () => {
  const View = ({
    children,
    onPress,
    testID,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    testID?: string
  }) => {
    const props: Record<string, unknown> = { ...rest }

    if (testID) {
      props['data-testid'] = testID
    }

    if (onPress) {
      props.onClick = onPress
      props.role = 'button'
    }

    return <div {...props}>{children}</div>
  }

  const styled = (Component: (props: any) => ReactNode, config: Record<string, unknown>) => {
    styledCalls.push({ config })
    return ({ children, ...rest }: { children?: ReactNode }) => (
      <Component {...rest}>{children}</Component>
    )
  }

  return {
    View,
    styled,
  }
})

const { ToggleSwitch } = await import('../ToggleSwitch')

describe('ToggleSwitch', () => {
  it('renders with checked state and toggles when pressed', () => {
    const onCheckedChange = vi.fn()

    render(<ToggleSwitch checked size="medium" onCheckedChange={onCheckedChange} testID="toggle" />)

    const toggle = screen.getByTestId('toggle')
    expect(toggle).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('does not toggle when disabled', () => {
    const onCheckedChange = vi.fn()

    render(
      <ToggleSwitch
        checked={false}
        disabled
        size="large"
        onCheckedChange={onCheckedChange}
        testID="toggle-disabled"
      />
    )

    const toggle = screen.getByTestId('toggle-disabled')
    fireEvent.click(toggle)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('applies size variants to styled components', () => {
    render(<ToggleSwitch checked size="small" onCheckedChange={vi.fn()} testID="toggle-small" />)

    expect(styledCalls.length).toBeGreaterThanOrEqual(2)
    expect(styledCalls[0].config.variants).toBeDefined()
  })
})
