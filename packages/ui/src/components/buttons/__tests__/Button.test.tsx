import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const buttonPropsStore = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('tamagui', () => {
  const MockButton = ({ children, disabled, ...rest }: { children?: ReactNode; disabled?: boolean }) => {
    buttonPropsStore.current = rest
    return (
      <button type="button" disabled={disabled} {...rest}>
        {children}
      </button>
    )
  }

  MockButton.Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  MockButton.Icon = ({ children }: { children?: ReactNode }) => (
    <span data-testid="button-icon">{children}</span>
  )

  return {
    Button: MockButton,
  }
})

const { Button } = await import('../Button')

describe('UIButton', () => {
  beforeEach(() => {
    buttonPropsStore.current = {}
  })

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>)

    expect(buttonPropsStore.current.bg).toBe('$blue7')
    expect(buttonPropsStore.current.color).toBe('$color1')
    expect(buttonPropsStore.current.fontWeight).toBe('600')
    expect(buttonPropsStore.current.animation).toBe('quick')
    expect(buttonPropsStore.current.hoverStyle).toEqual({ bg: '$blue8' })
    expect(buttonPropsStore.current.pressStyle).toEqual({ bg: '$blue9', scale: 0.97 })
  })

  it('maps outlined variant to border styling', () => {
    render(<Button variant="outlined">Outlined</Button>)

    expect(buttonPropsStore.current.bg).toBe('transparent')
    expect(buttonPropsStore.current.borderWidth).toBe(1)
    expect(buttonPropsStore.current.borderColor).toBe('$borderColor')
    expect(buttonPropsStore.current.hoverStyle).toEqual({
      bg: '$backgroundHover',
      borderColor: '$borderColorHover',
    })
    expect(buttonPropsStore.current.pressStyle).toEqual({ bg: '$backgroundPress', scale: 0.97 })
  })

  it('passes through additional props and supports subcomponents', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()

    render(
      <Button variant="danger" disabled data-testid="danger-btn" onPress={onPress}>
        <Button.Icon>!</Button.Icon>
        <Button.Text>Remove</Button.Text>
      </Button>
    )

    const button = screen.getByTestId('danger-btn')
    expect(button).toBeDisabled()
    expect(buttonPropsStore.current.bg).toBe('$red8')

    await user.click(button)
    expect(onPress).not.toHaveBeenCalled()

    expect(screen.getByText('Remove')).toBeInTheDocument()
    expect(screen.getByTestId('button-icon')).toHaveTextContent('!')
  })
})
