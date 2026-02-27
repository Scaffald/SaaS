/**
 * SavingModal – modal shown during save (spinner) or on save failure (error + retry)
 */

import { Modal, ModalHeader, ModalContent, ModalActions } from '../Modal'
import { Spinner } from '../Spinner'
import { Paragraph, Caption } from '../Typography'
import { CancelIcon } from '../Icon'
import { Stack } from '../Layout'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import type { SavingModalProps } from './SaveStatusIndicator.types'

export function SavingModal({
  open,
  onClose,
  isError = false,
  errorMessage,
  onRetry,
}: SavingModalProps) {
  return (
    <Modal
      visible={open}
      onClose={onClose}
      closeOnBackdropPress={isError}
      closeOnEscapeKey={isError}
      width={400}
    >
      <ModalHeader
        title={isError ? 'Save Failed' : 'Saving your changes...'}
        showCloseButton={isError}
        onClose={onClose}
      />
      <ModalContent>
        <Stack
          gap={spacing[4]}
          align="center"
          style={{ paddingVertical: spacing[4] }}
        >
          {isError ? (
            <>
              <CancelIcon size={48} color={colors.error[500]} />
              <Paragraph align="center" color="secondary">
                {errorMessage ||
                  'Failed to save your changes. Please try again.'}
              </Paragraph>
            </>
          ) : (
            <>
              <Spinner size="lg" color="primary" />
              <Paragraph align="center" color="secondary">
                Saving your changes...
              </Paragraph>
              <Caption align="center" color="tertiary">
                Please wait
              </Caption>
            </>
          )}
        </Stack>
      </ModalContent>
      {isError && (
        <ModalActions
          orientation="center"
          secondaryAction={{ label: 'Cancel', onPress: onClose }}
          primaryAction={
            onRetry ? { label: 'Retry', onPress: onRetry } : undefined
          }
        />
      )}
    </Modal>
  )
}
