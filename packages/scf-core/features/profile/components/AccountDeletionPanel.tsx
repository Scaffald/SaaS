import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  ACCOUNT_DELETION_STATUS_KEY,
  useAccountDeletionStatus,
  useCancelAccountDeletionMutation,
  useRequestWorkerDeletionMutation,
} from '@scf/core/utils/account-deletion-sdk-hooks'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { AlertTriangle, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { colors } from '@scaffald/ui/tokens'
import { describeScheduledDeletion, formatDeletionDate } from '../utils/scheduledDeletion'

// The card is a fixed light-red surface in both themes, so its body text is
// the light theme's body colour rather than the current theme's.
const BODY_TEXT = colors.text.light.secondary
import {
  Button,
  Card,
  Input,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  Text,
  TextArea,
  Row,
  Stack,
} from '@scaffald/ui'

export function AccountDeletionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const toast = useToast()
  const { signOut } = useSessionContext()
  const queryClient = useQueryClient()

  // A request already waiting out its grace period shows its date and a
  // Cancel here, instead of offering to request again (#1313).
  const { data: statusData } = useAccountDeletionStatus()
  const scheduled = describeScheduledDeletion(statusData?.request)

  const cancelMutation = useCancelAccountDeletionMutation({
    onSuccess: () => {
      toast.show({ title: 'Deletion cancelled', message: 'Your account will not be deleted.' })
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

  const deletionMutation = useRequestWorkerDeletionMutation({
    onSuccess: (request) => {
      // The account is deleted 14 days later by a daily job (#1313); signing
      // back in before then shows the date with a Cancel.
      toast.show({
        title: 'Account deletion requested',
        message: `Your account will be deleted on ${formatDeletionDate(request.scheduledFor)}. You'll be signed out now; sign back in before then if you change your mind.`,
        duration: 5000,
      })
      setIsOpen(false)
      setReason('')
      setConfirmText('')
      // Apple Guideline 5.1.1(v): the in-app flow must end with the user
      // signed out — they should not have to take further action to leave
      // the session that no longer maps to a backing account.
      void signOut()
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Deletion request failed',
        message: error.message || 'Failed to submit deletion request. Please try again.',
        variant: 'error',
      })
    },
  })

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      toast.show({
        title: 'Confirmation required',
        message: 'Please type "DELETE" to confirm account deletion.',
        variant: 'error',
      })
      return
    }

    deletionMutation.mutate({
      reason: reason || undefined,
    })
  }

  return (
    <Card
      variant="outlined"
      padding="md"
      style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
    >
      <Stack gap={12}>
        <Row align="center" gap={8}>
          <AlertTriangle color="#ef4444" size={20} />
          <Text style={{ color: '#ef4444' }}>Delete Account</Text>
        </Row>

        {scheduled ? (
          <>
            <Text style={{ color: BODY_TEXT }}>{scheduled.title}.</Text>
            <Text style={{ color: BODY_TEXT }}>{scheduled.message}</Text>
            {scheduled.canCancel ? (
              <Button
                variant="outline"
                onPress={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel deletion'}
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Text style={{ color: BODY_TEXT }}>
              Permanently delete your account and its data. Your account is deleted 14 days after
              you ask; until then you can sign back in and cancel. After that it cannot be undone.
            </Text>

            {/* What the deletion job does (_shared/account-deletion/policy.ts). */}
            <Text style={{ color: BODY_TEXT }}>
              • Your profile, applications, messages and files are deleted • Payment and
              background-check records we must keep are detached from you • You will lose access to
              all organizations and teams
            </Text>

            <Button
              variant="outline"
              style={{ borderColor: '#f87171' }}
              color="error"
              iconStart={Trash2}
              onPress={() => setIsOpen(true)}
            >
              Request Account Deletion
            </Button>
          </>
        )}

        <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={500}>
          <ModalHeader title="Delete Your Account?" onClose={() => setIsOpen(false)} />
          <ModalContent>
            <Stack gap={16}>
              <Text style={{ color: BODY_TEXT }}>
                Your account will be deleted in 14 days. You can cancel by signing back in before
                then; after that it cannot be undone.
              </Text>

              <Stack gap={8}>
                <Text>Reason (optional)</Text>
                <TextArea
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Help us improve by sharing why you're deleting your account..."
                  style={{ minHeight: 80 }}
                />
              </Stack>

              <Stack gap={8}>
                <Text>Type "DELETE" to confirm</Text>
                <Input
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="DELETE"
                  style={{
                    borderColor: confirmText === 'DELETE' ? '#86efac' : '#f87171',
                  }}
                />
              </Stack>
            </Stack>
          </ModalContent>
          <ModalActions
            orientation="right"
            secondaryAction={{
              label: 'Cancel',
              onPress: () => {
                setIsOpen(false)
                setConfirmText('')
                setReason('')
              },
              disabled: deletionMutation.isPending,
            }}
            primaryAction={{
              label: deletionMutation.isPending ? 'Deleting...' : 'Delete Account',
              onPress: handleDelete,
              disabled: confirmText !== 'DELETE' || deletionMutation.isPending,
              color: 'error',
            }}
          />
        </Modal>
      </Stack>
    </Card>
  )
}
