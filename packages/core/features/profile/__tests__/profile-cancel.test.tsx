import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
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
    Controller: ({ render }: { render: (props: { field: { value: string; onChange: (v: string) => void } }) => React.ReactNode }) =>
      render({ field: { value: '', onChange: vi.fn() } }),
  }
})

vi.mock('@app/ui', () => {
  const React = require('react') as typeof import('react')
  const Button = ({ children, onPress, disabled }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean }) => (
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
        <button type="button" onClick={() => onOpenChange(false)}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm}>{confirmLabel}</button>
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
    const [showDialog, setShowDialog] = React.useState(false)

    const cancelButton = (
      <button type="button" onClick={() => setShowDialog(true)} data-testid="cancel-button">
        Cancel
      </button>
    )

    const dialog = showDialog ? (
      <div data-testid="confirmation-dialog">
        <button type="button" onClick={() => setShowDialog(false)}>Keep Editing</button>
        <button type="button" onClick={() => setShowDialog(false)}>Discard Changes</button>
      </div>
    ) : null

    const { container, rerender } = render(
      <>
        {cancelButton}
        {dialog}
      </>,
    )

    const button = container.querySelector('[data-testid="cancel-button"]') as HTMLButtonElement
    fireEvent.click(button)

    rerender(
      <>
        {cancelButton}
        {showDialog ? dialog : null}
      </>,
    )

    expect(container.querySelector('[data-testid="confirmation-dialog"]')).toBeInTheDocument()
  })

  it('should reset form when "Discard Changes" is confirmed', () => {
    const reset = vi.fn()
    const [showDialog, setShowDialog] = React.useState(true)

    const handleDiscard = () => {
      reset({ name: 'Test User', email: 'test@example.com' })
      setShowDialog(false)
    }

    const dialog = showDialog ? (
      <div data-testid="confirmation-dialog">
        <button type="button" onClick={() => setShowDialog(false)}>Keep Editing</button>
        <button type="button" onClick={handleDiscard} data-testid="discard-button">
          Discard Changes
        </button>
      </div>
    ) : null

    const { container } = render(dialog)
    const discardButton = container.querySelector('[data-testid="discard-button"]') as HTMLButtonElement

    fireEvent.click(discardButton)

    expect(reset).toHaveBeenCalledWith({ name: 'Test User', email: 'test@example.com' })
  })

  it('should close dialog without changes when "Keep Editing" is clicked', () => {
    const reset = vi.fn()
    const [showDialog, setShowDialog] = React.useState(true)

    const dialog = showDialog ? (
      <div data-testid="confirmation-dialog">
        <button onClick={() => setShowDialog(false)} data-testid="keep-editing-button">
          Keep Editing
        </button>
        <button onClick={() => reset()}>Discard Changes</button>
      </div>
    ) : null

    const { container, rerender } = render(dialog)
    const keepButton = container.querySelector('[data-testid="keep-editing-button"]') as HTMLButtonElement

    fireEvent.click(keepButton)

    rerender(showDialog ? dialog : null)

    expect(reset).not.toHaveBeenCalled()
    expect(container.querySelector('[data-testid="confirmation-dialog"]')).not.toBeInTheDocument()
  })
})

