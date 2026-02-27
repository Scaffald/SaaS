/**
 * SaveStatusIndicator and SavingModal type definitions
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveStatusIndicatorProps {
  /** Current save status */
  status: SaveStatus
  /** Timestamp of last successful save */
  lastSavedAt?: Date | null
  /** Error message to display when status is 'error' */
  error?: string
  /** Duration in ms to auto-hide success state */
  autoHideDuration?: number
}

export interface SavingModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Whether save operation failed */
  isError?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Callback when retry is clicked */
  onRetry?: () => void
}
