import { AlertCircle } from '@tamagui/lucide-icons'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'
import { ResponsiveModal } from './ResponsiveModal'

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

/**
 * SavingModal Component
 *
 * Modal displayed during forced save operations before navigation.
 * Shows saving state with spinner, or error state with retry option.
 *
 * @example
 * ```tsx
 * <SavingModal
 *   open={isSaving}
 *   onClose={() => setIsSaving(false)}
 *   isError={saveFailed}
 *   errorMessage="Failed to save changes"
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function SavingModal({
  open,
  onClose,
  isError = false,
  errorMessage,
  onRetry,
}: SavingModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isError) {
          onClose()
        }
      }}
      title={isError ? 'Save Failed' : 'Saving your changes...'}
      size="small"
      showCloseButton={isError}
    >
      <YStack gap="$4" items="center" p="$4">
        {isError ? (
          <>
            <AlertCircle size={48} color="$red9" />
            <Text fontSize="$4" color="$color12" style={{ textAlign: 'center' }}>
              {errorMessage || 'Failed to save your changes. Please try again.'}
            </Text>
            <XStack gap="$3" pt="$2">
              <Button variant="outlined" onPress={onClose}>
                Cancel
              </Button>
              {onRetry && (
                <Button onPress={onRetry} themeInverse>
                  Retry
                </Button>
              )}
            </XStack>
          </>
        ) : (
          <>
            <Spinner size="large" color="$blue9" />
            <Text fontSize="$4" color="$color12" style={{ textAlign: 'center' }}>
              Saving your changes...
            </Text>
            <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
              Please wait
            </Text>
          </>
        )}
      </YStack>
    </ResponsiveModal>
  )
}
