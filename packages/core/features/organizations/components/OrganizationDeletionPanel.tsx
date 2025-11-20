import { api } from '@app/core/utils/api'
import { useToast } from '@app/ui'
import { AlertTriangle, Trash2 } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { AlertDialog, Button, Card, Input, Text, TextArea, XStack, YStack } from 'tamagui'

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
    <Card borderWidth={1} borderColor="$red6" bg="$red2" p="$4">
      <YStack gap="$3">
        <XStack items="center" gap="$2">
          <AlertTriangle color="$red11" size={20} />
          <Text fontSize="$6" fontWeight="700" color="$red11">
            Delete Organization
          </Text>
        </XStack>

        <Text color="$color11" fontSize="$3">
          Permanently delete this organization and all associated data. This action cannot be
          undone.
        </Text>

        <Text color="$color10" fontSize="$2">
          • All payment data will be anonymized • All payment methods will be removed from Stripe •
          Organization members will lose access • All jobs and applications will be archived
        </Text>

        <Button
          variant="outlined"
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
              <YStack gap="$4" p="$4">
                <YStack gap="$2">
                  <Text fontSize="$7" fontWeight="700" color="$red11">
                    Delete This Organization?
                  </Text>
                  <Text color="$color11" fontSize="$3">
                    This action cannot be undone. All organization data will be permanently deleted
                    or anonymized.
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$4" fontWeight="600">
                    Reason (optional)
                  </Text>
                  <TextArea
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Help us improve by sharing why you're deleting this organization..."
                    style={{ minHeight: 80 }}
                  />
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$4" fontWeight="600">
                    Type "DELETE" to confirm
                  </Text>
                  <Input
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder="DELETE"
                    borderColor={confirmText === 'DELETE' ? '$green8' : '$red8'}
                  />
                </YStack>

                <XStack gap="$3" justify="flex-end">
                  <Button
                    variant="outlined"
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
                    bg="$red9"
                    color="white"
                    icon={Trash2}
                    onPress={handleDelete}
                    disabled={confirmText !== 'DELETE' || deletionMutation.isPending}
                  >
                    {deletionMutation.isPending ? 'Deleting...' : 'Delete Organization'}
                  </Button>
                </XStack>
              </YStack>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      </YStack>
    </Card>
  )
}
