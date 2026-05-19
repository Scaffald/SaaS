import type { ConfirmDialog } from './confirmDialog'

export const confirmDialog: ConfirmDialog = ({ title, message }) =>
  Promise.resolve(
    typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(title ? `${title}\n\n${message}` : message)
      : false
  )
