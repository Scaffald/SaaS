import { api } from '@scf/core/utils/api'
import { useToast } from '@unicornlove/beyond-ui'
import { AlertTriangle, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import {
  AlertDialog,
  Button,
  Card,
  Input,
  Text,
  TextArea,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

type OrganizationDeletionPanelProps = {
  organizationId: string
}

export function OrganizationDeletionPanel({ organizationId }: OrganizationDeletionPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const toast = useToast()

  const deletionMutation = api.accountDeletion.requestOrganizationDeletion.useMutation({
    onSuccess: () => {
      toast.show('Organization deletion requested', {
        message:
          'The organization deletion request has been submitted. All members will be notified.',
        duration: 5000,
      })
      setIsOpen(false)
      setReason('')
      setConfirmText('')
    },
    onError: (error: { message?: string }) => {
      toast.show('Deletion request failed', {
        message: error.message || 'Failed to submit deletion request. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = () => {
    if (confirmText !== 'DELETE') {
      toast.show('Confirmation required', {
        message: 'Please type "DELETE" to confirm organization deletion.',
        variant: 'destructive',
      })
      return
    }

    deletionMutation.mutate({
      organizationId,
      reason: reason || undefined,
    })
  }

  return (
    <Card borderWidth={1} borderColor="$red6" backgroundColor="$red2" padding="md">
      <Stack gap={12}>
        <Row align="center" gap={8}>
          <AlertTriangle color="$red11" size="lg" />
          <Text color="$red11">Delete Organization</Text>
        </Row>

        <Text color="$gray11">
          Permanently delete this organization and all associated data. This action cannot be
          undone.
        </Text>

        <Text color="$gray11">
          • All payment data will be anonymized • All payment methods will be removed from Stripe •
          Organization members will lose access • All jobs and applications will be archived
        </Text>

        <Button
          variant="outline"
          borderColor="$red8"
          color="$red11"
          icon={Trash2}
          onPress={() => setIsOpen(true)}
        >
          Request Organization Deletion
        </Button>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay />
            <AlertDialog.Content style={{ maxWidth: 500 }}>
              <Stack gap={16} padding="md">
                <Stack gap={8}>
                  <Text color="$red11">Delete This Organization?</Text>
                  <Text color="$gray11">
                    This action cannot be undone. All organization data will be permanently deleted
                    or anonymized.
                  </Text>
                </Stack>

                <Stack gap={8}>
                  <Text>Reason (optional)</Text>
                  <TextArea
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Help us improve by sharing why you're deleting this organization..."
                    style={{ minHeight: 80 }}
                  />
                </Stack>

                <Stack gap={8}>
                  <Text>Type "DELETE" to confirm</Text>
                  <Input
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder="DELETE"
                    borderColor={confirmText === 'DELETE' ? '$green8' : '$red8'}
                  />
                </Stack>

                <Row gap={12} justify="flex-end">
                  <Button
                    variant="outline"
                    onPress={() => {
                      setIsOpen(false)
                      setConfirmText('')
                      setReason('')
                    }}
                    disabled={deletionMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    backgroundColor="$red9"
                    color="white"
                    icon={Trash2}
                    onPress={handleDelete}
                    disabled={confirmText !== 'DELETE' || deletionMutation.isPending}
                  >
                    {deletionMutation.isPending ? 'Deleting...' : 'Delete Organization'}
                  </Button>
                </Row>
              </Stack>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </Stack>
    </Card>
  )
}
