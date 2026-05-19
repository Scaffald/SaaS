/**
 * Cross-platform confirm dialog.
 *
 * Web: wraps `window.confirm` in a Promise so call-sites can `await` it.
 * Native: uses `Alert.alert` with two buttons.
 *
 * Replaces direct `window.confirm` calls (which silently no-op on native).
 */

export interface ConfirmDialogOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** When true, styles the confirm button as destructive on native. */
  destructive?: boolean
}

export type ConfirmDialog = (options: ConfirmDialogOptions) => Promise<boolean>

export const confirmDialog: ConfirmDialog = () => {
  throw new Error(
    '[platform/confirmDialog] platform-specific module was not resolved; check Metro config'
  )
}
