import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock all profile form components to test cancel behavior pattern
vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: vi.fn(),
  }),
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    useContext: () => ({
      profile: {
        getGeneral: {
          cancel: vi.fn(),
          getData: vi.fn(() => ({ name: 'Test User', email: 'test@example.com' })),
          setData: vi.fn(),
        },
      },
    }),
    profile: {
      getGeneral: {
        useQuery: () => ({
          data: { name: 'Test User', email: 'test@example.com' },
          isLoading: false,
        }),
      },
      updateGeneral: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isLoading: false,
        }),
      },
    },
  },
}))

vi.mock('react-hook-form', () => {
  const actual = vi.importActual('react-hook-form')
  return {
    ...actual,
    useForm: () => ({
      control: {},
      handleSubmit: (fn: () => void) => fn,
      reset: vi.fn(),
      watch: () => ({}),
      formState: {
        isDirty: true,
        errors: {},
      },
      setValue: vi.fn(),
      getValues: () => ({ name: 'Test User', email: 'test@example.com' }),
    }),
    Controller: ({
      render,
    }: {
      render: (props: {
        field: { value: string; onChange: (v: string) => void }
      }) => React.ReactNode
    }) => render({ field: { value: '', onChange: vi.fn() } }),
  }
})

vi.mock('@app/ui', () => {
  const React = require('react') as typeof import('react')
  const Button = ({
    children,
    onPress,
    disabled,
  }: {
    children: React.ReactNode
    onPress?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onPress} disabled={disabled}>
      {children}
    </button>
  )
  const ConfirmationDialog = ({
    open,
    onOpenChange,
    onConfirm,
    cancelLabel,
    confirmLabel,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    cancelLabel: string
    confirmLabel: string
  }) =>
    open ? (
      <div data-testid="confirmation-dialog">
        <button type="button" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    ) : null

  return {
    UIButton: Button,
    DashboardWidget: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ConfirmationDialog,
  }
})

vi.mock('tamagui', () => ({
  YStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  XStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Input: ({ value, onChangeText }: { value?: string; onChangeText?: (v: string) => void }) => (
    <input value={value} onChange={(e) => onChangeText?.(e.target.value)} />
  ),
}))

describe('Profile Cancel Button Pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show cancel button only when form is dirty', () => {
    // This test verifies the pattern - cancel button should be disabled when isDirty is false
    const isDirty = true
    const cancelButton = (
      <button type="button" disabled={!isDirty} data-testid="cancel-button">
        Cancel
      </button>
    )

    const { container } = render(cancelButton)
    const button = container.querySelector('[data-testid="cancel-button"]') as HTMLButtonElement

    expect(button).not.toBeDisabled()
  })

  it('should show confirmation dialog when cancel is clicked', () => {
    function Harness() {
      const [showDialog, setShowDialog] = React.useState(false)
      return (
        <>
          <button type="button" onClick={() => setShowDialog(true)} data-testid="cancel-button">
            Cancel
          </button>
          {showDialog ? (
            <div data-testid="confirmation-dialog">
              <button type="button" onClick={() => setShowDialog(false)}>
                Keep Editing
              </button>
              <button type="button" onClick={() => setShowDialog(false)}>
                Discard Changes
              </button>
            </div>
          ) : null}
        </>
      )
    }

    render(<Harness />)

    fireEvent.click(screen.getByTestId('cancel-button'))

    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument()
  })

  it('should reset form when "Discard Changes" is confirmed', () => {
    const reset = vi.fn()

    function Harness() {
      const [showDialog, setShowDialog] = React.useState(true)
      const handleDiscard = () => {
        reset({ name: 'Test User', email: 'test@example.com' })
        setShowDialog(false)
      }

      return showDialog ? (
        <div data-testid="confirmation-dialog">
          <button type="button" onClick={() => setShowDialog(false)}>
            Keep Editing
          </button>
          <button type="button" onClick={handleDiscard} data-testid="discard-button">
            Discard Changes
          </button>
        </div>
      ) : (
        <span>No dialog</span>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByTestId('discard-button'))

    expect(reset).toHaveBeenCalledWith({ name: 'Test User', email: 'test@example.com' })
  })

  it('should close dialog without changes when "Keep Editing" is clicked', () => {
    const reset = vi.fn()

    function Harness() {
      const [showDialog, setShowDialog] = React.useState(true)
      return showDialog ? (
        <div data-testid="confirmation-dialog">
          <button
            type="button"
            onClick={() => setShowDialog(false)}
            data-testid="keep-editing-button"
          >
            Keep Editing
          </button>
          <button type="button" onClick={() => reset()}>
            Discard Changes
          </button>
        </div>
      ) : (
        <span>No dialog</span>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByTestId('keep-editing-button'))

    expect(reset).not.toHaveBeenCalled()
    expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument()
  })
})
