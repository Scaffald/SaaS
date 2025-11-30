import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const toastState = vi.hoisted<{
  current: null | {
    id: string
    duration?: number
    viewportName?: string
    title?: string
    message?: string
    isHandledNatively?: boolean
  }
}>(() => ({ current: null }))

const toastPropsStore = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))

vi.mock('@tamagui/toast', () => {
  const MockToast = ({ children, ...rest }: { children?: ReactNode }) => {
    toastPropsStore.current = rest
    return <div data-testid="toast">{children}</div>
  }

  const MockTitle = ({ children }: { children?: ReactNode }) => (
    <div data-testid="toast-title">{children}</div>
  )
  const MockDescription = ({ children }: { children?: ReactNode }) => (
    <div data-testid="toast-description">{children}</div>
  )
  ;(MockToast as any).Title = MockTitle
  ;(MockToast as any).Description = MockDescription

  return {
    Toast: MockToast,
    useToastState: () => toastState.current,
  }
})

vi.mock('tamagui', () => ({
  YStack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  XStack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))

const { CustomToast } = await import('../CustomToast')

describe('CustomToast', () => {
  it('returns null when no toast state present', () => {
    toastState.current = null
    const { container } = render(<CustomToast />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when toast handled natively', () => {
    toastState.current = {
      id: 'native-toast',
      isHandledNatively: true,
    }

    const { container } = render(<CustomToast />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toast content and forwards props', () => {
    toastState.current = {
      id: 'toast-1',
      duration: 5000,
      viewportName: 'default',
      title: 'Saved!',
      message: 'Profile updated successfully',
      isHandledNatively: false,
    }

    render(<CustomToast />)

    expect(screen.getByTestId('toast')).toBeInTheDocument()
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Saved!')
    expect(screen.getByTestId('toast-description')).toHaveTextContent(
      'Profile updated successfully'
    )
    expect(toastPropsStore.current).toMatchObject({
      duration: 5000,
      viewportName: 'default',
      themeInverse: true,
      animation: '100ms',
    })
  })

  it('omits description when message absent', () => {
    toastState.current = {
      id: 'toast-2',
      title: 'Notice',
      duration: 3000,
      isHandledNatively: false,
    }

    render(<CustomToast />)

    expect(screen.queryByTestId('toast-description')).toBeNull()
  })
})
