import { api } from '@app/core/utils/api'
import { ResponsiveModal } from '@scaffald/tamagui-ui'
import { useToastController } from '@tamagui/toast'
import { useEffect, useState } from 'react'
import { Button, Text, TextArea, YStack } from 'tamagui'

interface RemoveMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  member?: {
    id: string
    userId?: string | null
    displayName?: string | null
  } | null
  onRemoved?: () => void
}

export function RemoveMemberModal({
  open,
  onOpenChange,
  teamId,
  member,
  onRemoved,
}: RemoveMemberModalProps) {
  const toast = useToastController()
  const [reason, setReason] = useState('')

  const removeMemberMutation = api.teams.members.remove.useMutation({
    onSuccess: () => {
      toast.show('Member removed', { message: `${member?.displayName ?? 'Member'} was removed.` })
      onOpenChange(false)
      onRemoved?.()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show('Unable to remove member', { message })
    },
  })

  useEffect(() => {
    if (open) {
      setReason('')
    }
  }, [open])

  const handleRemove = async () => {
    if (!member) return
    await removeMemberMutation.mutateAsync({
      teamMemberId: member.id,
      teamId,
      reason: reason.trim() ? reason.trim() : undefined,
    })
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Remove team member">
      <YStack gap="$4">
        <Text fontSize="$4">
          Are you sure you want to remove{' '}
          <Text fontWeight="700">{member?.displayName ?? 'this member'}</Text> from the team?
        </Text>

        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            Removal reason (optional)
          </Text>
          <TextArea
            value={reason}
            onChangeText={setReason}
            placeholder="Provide additional context for other admins…"
            rows={4}
            borderWidth={1}
            borderColor="$borderColor"
            px="$3"
            py="$2"
            disabled={removeMemberMutation.isPending}
          />
        </YStack>

        <YStack gap="$2" bg="$color2" p="$3" rounded="$4">
          <Text fontWeight="600">What happens next?</Text>
          <Text color="$color11" fontSize="$3">
            • The member loses access to the team immediately.
          </Text>
          <Text color="$color11" fontSize="$3">
            • Their review history is preserved for auditing.
          </Text>
          <Text color="$color11" fontSize="$3">
            • You can re-add them later if needed.
          </Text>
        </YStack>

        <YStack gap="$3">
          <Button
            bg="$red9"
            color="$color1"
            onPress={handleRemove}
            disabled={removeMemberMutation.isPending}
          >
            {removeMemberMutation.isPending ? 'Removing…' : 'Remove Member'}
          </Button>
          <Button
            variant="outlined"
            onPress={() => onOpenChange(false)}
            disabled={removeMemberMutation.isPending}
          >
            Cancel
          </Button>
        </YStack>
      </YStack>
    </ResponsiveModal>
  )
}
