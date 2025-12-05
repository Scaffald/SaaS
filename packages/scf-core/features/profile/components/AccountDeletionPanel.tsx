import { api } from '@scf/core/utils/api'
import { useToast } from '@unicornlove/ui'
import { AlertTriangle, Trash2 } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { AlertDialog, Button, Card, Input, Text, TextArea, XStack, YStack } from '@unicornlove/ui'

export function AccountDeletionPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const toast = useToast()

  const deletionMutation = api.accountDeletion.requestWorkerDeletion.useMutation({
    onSuccess: () => {
      toast.show('Account deletion requested', {
        message:
          'Your account deletion request has been submitted. You will be logged out shortly.',
        duration: 5000,
      })
      setIsOpen(false)
      setReason('')
      setConfirmText('')
      // In production, redirect to logout or show confirmation page
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
        message: 'Please type "DELETE" to confirm account deletion.',
        variant: 'destructive',
      })
      return
    }

    deletionMutation.mutate({
      reason: reason || undefined,
    })
  }

  return (
    <Card borderWidth={1} borderColor="$red6" backgroundColor="$red2" padding="$4">
      <YStack gap="$3">
        <XStack alignItems="center" gap="$2">
          <AlertTriangle color="$red11" size={20} />
          <Text fontSize="$6" fontWeight="700" color="$red11">
            Delete Account
          </Text>
        </XStack>

        <Text color="$color11" fontSize="$3">
          Permanently delete your account and all associated data. This action cannot be undone.
        </Text>

        <Text color="$color10" fontSize="$2">
          • All payment data will be anonymized • Your profile will be removed • You will lose
          access to all organizations and teams
        </Text>

        <Button
          variant="outlined"
          borderColor="$red8"
          color="$red11"
          icon={Trash2}
          onPress={() => setIsOpen(true)}
        >
          Request Account Deletion
        </Button>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay />
            <AlertDialog.Content style={{ maxWidth: 500 }}>
              <YStack gap="$4" padding="$4">
                <YStack gap="$2">
                  <Text fontSize="$7" fontWeight="700" color="$red11">
                    Delete Your Account?
                  </Text>
                  <Text color="$color11" fontSize="$3">
                    This action cannot be undone. All your data will be permanently deleted or
                    anonymized.
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$4" fontWeight="600">
                    Reason (optional)
                  </Text>
                  <TextArea
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Help us improve by sharing why you're deleting your account..."
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

                <XStack gap="$3" justifyContent="flex-end">
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
                    backgroundColor="$red9"
                    color="white"
                    icon={Trash2}
                    onPress={handleDelete}
                    disabled={confirmText !== 'DELETE' || deletionMutation.isPending}
                  >
                    {deletionMutation.isPending ? 'Deleting...' : 'Delete Account'}
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
