import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

const windowDimensions = vi.hoisted(() => ({ width: 1024 }))
const dialogProps = vi.hoisted(() => ({ content: null as Record<string, unknown> | null }))
const sheetProps = vi.hoisted(() => ({ frame: null as Record<string, unknown> | null, sheet: null as Record<string, unknown> | null }))

vi.mock('tamagui', () => {
  const basicDiv = ({ testID, children, ...rest }: { testID?: string; children?: ReactNode }) => (
    <div data-testid={testID} {...rest}>
      {children}
    </div>
  )

  const Dialog = ({ children, ...rest }: { children?: ReactNode }) => (
    <div data-testid="dialog" {...rest}>
      {children}
    </div>
  )

  Dialog.Portal = ({ children }: { children?: ReactNode }) => (
    <div data-testid="dialog-portal">{children}</div>
  )

  Dialog.Overlay = (props: Record<string, unknown>) => (
    <div data-testid="dialog-overlay" {...props} />
  )

  Dialog.Content = (props: Record<string, unknown>) => {
    dialogProps.content = props
    return (
      <div data-testid="dialog-content" {...props}>
        {props.children as ReactNode}
      </div>
    )
  }

  Dialog.Title = ({ children, ...rest }: { children?: ReactNode }) => (
    <h2 data-testid="dialog-title" {...rest}>
      {children}
    </h2>
  )

  Dialog.Close = ({ asChild, children }: { asChild?: boolean; children?: ReactNode }) => (
    <div data-testid="dialog-close">{asChild ? children : children}</div>
  )

  const Sheet = ({ children, ...rest }: { children?: ReactNode }) => {
    sheetProps.sheet = rest
    return (
      <div data-testid="sheet" {...rest}>
        {children}
      </div>
    )
  }

  Sheet.Overlay = (props: Record<string, unknown>) => <div data-testid="sheet-overlay" {...props} />

  Sheet.Frame = (props: Record<string, unknown>) => {
    sheetProps.frame = props
    return (
      <div data-testid="sheet-frame" {...props}>
        {props.children as ReactNode}
      </div>
    )
  }

  Sheet.Handle = () => <div data-testid="sheet-handle" />

  const Button = ({
    onPress,
    children,
    ...rest
  }: { onPress?: () => void; children?: ReactNode }) => (
    <button type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  )

  const ScrollView = ({ children }: { children?: ReactNode }) => (
    <div data-testid="scroll-view">{children}</div>
  )

  const XStack = basicDiv
  const YStack = basicDiv
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>

  const useWindowDimensions = () => ({ width: windowDimensions.width })

  return {
    Dialog,
    Sheet,
    Button,
    ScrollView,
    XStack,
    YStack,
    Text,
    useWindowDimensions,
  }
})

const iconMock = vi.hoisted(() => vi.fn(() => <span data-testid="icon" />))
vi.mock('@tamagui/lucide-icons', () => ({ X: iconMock }))

const { ResponsiveModal } = await import('../ResponsiveModal')

describe('ResponsiveModal', () => {
  it('renders desktop dialog with size presets', () => {
    const onOpenChange = vi.fn()
    windowDimensions.width = 1024

    render(
      <ResponsiveModal open title="Desktop Modal" onOpenChange={onOpenChange} size="large">
        <p>content</p>
      </ResponsiveModal>
    )

    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    expect(screen.queryByTestId('sheet-frame')).not.toBeInTheDocument()

    expect(dialogProps.content?.width).toBe(900)
    expect(dialogProps.content?.height).toBe(800)
  })

  it('renders sheet on mobile and invokes onOpenChange when close pressed', () => {
    const onOpenChange = vi.fn()
    windowDimensions.width = 600

    render(
      <ResponsiveModal
        open
        title="Mobile Modal"
        onOpenChange={onOpenChange}
        sheetSnapPoints={[80, 40]}
      >
        <p>mobile</p>
      </ResponsiveModal>
    )

    expect(screen.getByTestId('sheet-frame')).toBeInTheDocument()
    expect(sheetProps.sheet?.snapPoints).toEqual([80, 40])

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('respects custom dialog dimensions', () => {
    const onOpenChange = vi.fn()
    windowDimensions.width = 900

    render(
      <ResponsiveModal
        open
        title="Custom"
        onOpenChange={onOpenChange}
        dialogWidth={640}
        dialogHeight={480}
      >
        <p>custom content</p>
      </ResponsiveModal>
    )

    expect(dialogProps.content?.width).toBe(640)
    expect(dialogProps.content?.height).toBe(480)
  })
})
