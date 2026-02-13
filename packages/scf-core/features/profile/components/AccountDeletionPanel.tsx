import { api } from '@scf/core/utils/api'
import { useToast } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
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
} , useThemeContext } from '@unicornlove/beyond-ui'

export function AccountDeletionPanel() {
  const { theme } = useThemeContext()
) {
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
    <Card borderWidth={1} style={{ borderColor: colors.border[theme].error }} backgroundColor: colors.bg[theme].error }} padding="md">
      <Stack gap={12}>
        <Row align="center" gap={8}>
          <AlertTriangle style={{ color: colors.text[theme].error }} size="lg" />
          <Text style={{ color: colors.text[theme].error }}>Delete Account</Text>
        </Row>

        <Text style={{ color: colors.text[theme].secondary }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </Text>

        <Text style={{ color: colors.text[theme].secondary }}>
          • All payment data will be anonymized • Your profile will be removed • You will lose
          access to all organizations and teams
        </Text>

        <Button
          variant="outline"
          style={{ borderColor: colors.border[theme].error }}
          style={{ color: colors.text[theme].error }}
          iconStart={Trash2}
          onPress={() => setIsOpen(true)}
        >
          Request Account Deletion
        </Button>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay />
            <AlertDialog.Content style={{ maxWidth: 500 }}>
              <Stack gap={16} padding="md">
                <Stack gap={8}>
                  <Text style={{ color: colors.text[theme].error }}>Delete Your Account?</Text>
                  <Text style={{ color: colors.text[theme].secondary }}>
                    This action cannot be undone. All your data will be permanently deleted or
                    anonymized.
                  </Text>
                </Stack>

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
                    borderColor={confirmText === 'DELETE' ? colors.border[theme].success : colors.border[theme].error}
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
                    style={{ backgroundColor: colors.bg[theme].error }}
                    color="white"
                    iconStart={Trash2}
                    onPress={handleDelete}
                    disabled={confirmText !== 'DELETE' || deletionMutation.isPending}
                  >
                    {deletionMutation.isPending ? 'Deleting...' : 'Delete Account'}
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
