import { useRemoveTeamMember } from '@scaffald/sdk/react'
import { useEffect, useState } from 'react'
import { ResponsiveModal, useToast, Button, Text, TextArea, Stack } from '@unicornlove/beyond-ui'

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
  const toast = useToast()
  const [reason, setReason] = useState('')

  const removeMemberMutation = useRemoveTeamMember({
    onSuccess: () => {
      toast.show({
        title: 'Member removed',
        message: `${member?.displayName ?? 'Member'} was removed.`,
        variant: 'success',
      })
      onOpenChange(false)
      onRemoved?.()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: 'Unable to remove member',
        message,
        variant: 'error',
      })
    },
  })

  useEffect(() => {
    if (open) {
      setReason('')
    }
  }, [open])

  const handleRemove = async () => {
    if (!member?.userId) return
    await removeMemberMutation.mutateAsync({
      teamId,
      userId: member.userId,
      params: {
        reason: reason.trim() ? reason.trim() : undefined,
      },
    })
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Remove team member">
      <Stack gap={16}>
        <Text>
          Are you sure you want to remove <Text>{member?.displayName ?? 'this member'}</Text> from
          the team?
        </Text>

        <Stack gap={8}>
          <Text color="gray">Removal reason (optional)</Text>
          <TextArea
            value={reason}
            onChangeText={setReason}
            placeholder="Provide additional context for other admins…"
            rows={4}
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal={12}
            paddingVertical={8}
            disabled={removeMemberMutation.isPending}
          />
        </Stack>

        <Stack gap={8} backgroundColor="$color2" padding={12} borderRadius={16}>
          <Text>What happens next?</Text>
          <Text color="gray">• The member loses access to the team immediately.</Text>
          <Text color="gray">• Their review history is preserved for auditing.</Text>
          <Text color="gray">• You can re-add them later if needed.</Text>
        </Stack>

        <Stack gap={12}>
          <Button
            backgroundColor="$red9"
            color="gray"
            onPress={handleRemove}
            disabled={removeMemberMutation.isPending}
          >
            {removeMemberMutation.isPending ? 'Removing…' : 'Remove Member'}
          </Button>
          <Button
            variant="outline"
            onPress={() => onOpenChange(false)}
            disabled={removeMemberMutation.isPending}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </ResponsiveModal>
  )
}
