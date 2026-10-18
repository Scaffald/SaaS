/**
 * Shown on sign-in while the user's account is scheduled for deletion (#1313).
 *
 * Requesting deletion signs the user out, and the account is deleted 14 days
 * later. Signing back in during that time is normal; this tells them the date
 * and offers Cancel. Closing it leaves the request in place — Settings →
 * Account shows it again (AccountDeletionPanel) — and it reappears on the next
 * app load.
 *
 * Rendered beside the navigator, never instead of it: a layout that swaps its
 * Slot for something else rewrites the URL on web hydration.
 */

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal, ModalActions, ModalContent, ModalHeader, Text, useToast } from '@scaffald/ui'

import {
  ACCOUNT_DELETION_STATUS_KEY,
  useAccountDeletionStatus,
  useCancelAccountDeletionMutation,
} from '@scf/core/utils/account-deletion-sdk-hooks'

import { describeScheduledDeletion } from '../utils/scheduledDeletion'

export function PendingDeletionNotice({ enabled }: { enabled: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data } = useAccountDeletionStatus({ enabled })

  const cancel = useCancelAccountDeletionMutation({
    onSuccess: () => {
      toast.show({
        title: 'Deletion cancelled',
        message: 'Your account will not be deleted.',
      })
      setDismissed(true)
      queryClient.invalidateQueries({ queryKey: ACCOUNT_DELETION_STATUS_KEY })
    },
    onError: (error) => {
      toast.show({
        title: 'Could not cancel',
        message: error.message || 'Please try again, or email support@scaffald.com.',
        variant: 'error',
      })
      queryClient.invalidateQueries({ queryKey: ACCOUNT_DELETION_STATUS_KEY })
    },
  })

  const copy = enabled ? describeScheduledDeletion(data?.request) : null
  if (!copy || dismissed) return null

  const close = () => setDismissed(true)

  return (
    <Modal visible onClose={close} width={480}>
      <ModalHeader title={copy.title} onClose={close} />
      <ModalContent>
        <Text>{copy.message}</Text>
      </ModalContent>
      <ModalActions
        orientation="right"
        secondaryAction={{ label: 'Close', onPress: close, disabled: cancel.isPending }}
        primaryAction={
          copy.canCancel
            ? {
                label: cancel.isPending ? 'Cancelling…' : 'Cancel deletion',
                onPress: () => cancel.mutate(),
                disabled: cancel.isPending,
              }
            : undefined
        }
      />
    </Modal>
  )
}
