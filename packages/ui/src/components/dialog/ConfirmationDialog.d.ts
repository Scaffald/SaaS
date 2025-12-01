import type { ComponentType } from 'react'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmTheme?: 'red' | 'blue' | 'green'
  isLoading?: boolean
}

declare const ConfirmationDialog: ComponentType<ConfirmationDialogProps>

export { ConfirmationDialog }
export type { ConfirmationDialogProps }

