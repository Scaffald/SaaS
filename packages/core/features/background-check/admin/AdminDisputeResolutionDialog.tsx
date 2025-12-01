import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Dialog, Label, Separator, Spinner, Text, TextArea, XStack, YStack } from 'tamagui'

const RESOLUTION_STATUSES = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'upheld', label: 'Upheld' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

type RouterOutputs = inferRouterOutputs<AppRouter>
type AdminDisputeSummary = RouterOutputs['backgroundChecks']['adminListDisputes'][number]

interface AdminDisputeResolutionDialogProps {
  dispute: AdminDisputeSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolved: () => void
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function AdminDisputeResolutionDialog({
  dispute,
  open,
  onOpenChange,
  onResolved,
}: AdminDisputeResolutionDialogProps) {
  const toast = useToastController()
  const utils = api.useUtils()

  const [resolutionStatus, setResolutionStatus] =
    useState<(typeof RESOLUTION_STATUSES)[number]['value']>('resolved')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (dispute && open) {
      setResolutionStatus('resolved')
      setResolutionNotes('')
    }
  }, [dispute, open])

  const mutation = api.backgroundChecks.adminResolveDispute.useMutation({
    onSuccess: async () => {
      toast.show('Dispute resolved', {
        message: 'The worker and requester will receive notifications shortly.',
      })
      await Promise.all([
        utils.backgroundChecks.adminListDisputes.invalidate(),
        utils.backgroundChecks.adminListChecks.invalidate(),
      ])
      onResolved()
    },
    onError: (error: unknown) => {
      toast.show('Unable to resolve dispute', {
        message: error instanceof Error ? error.message : 'Please try again shortly.',
        type: 'error',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleResolve = () => {
    if (!dispute || isSubmitting) return
    setIsSubmitting(true)
    mutation.mutate({
      dispute_id: dispute.id,
      status: resolutionStatus,
      resolution: resolutionNotes.trim() ? resolutionNotes.trim() : null,
      resolution_notes: resolutionNotes.trim() ? resolutionNotes.trim() : null,
    })
  }

  const workerName = useMemo(() => {
    if (!dispute?.background_check?.worker) return 'Worker'
    const worker = dispute.background_check.worker
    return worker.display_name ?? worker.username ?? `User ${worker.id?.slice(0, 8) ?? ''}`
  }, [dispute?.background_check?.worker])

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.4}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          key="content"
          bordered
          elevate
          animation="quick"
          enterStyle={{ opacity: 0, scale: 0.95 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
          style={{ width: '90%', maxWidth: 640, maxHeight: '85%' }}
        >
          <YStack gap="$4">
            <XStack justify="space-between" items="center">
              <Dialog.Title fontSize="$6" fontWeight="700">
                Resolve dispute
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button size="$2" variant="outlined" disabled={isSubmitting}>
                  Close
                </Button>
              </Dialog.Close>
            </XStack>

            {dispute ? (
              <YStack gap="$3">
                <YStack
                  gap="$2"
                  p="$3"
                  bg="$color2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  rounded="$4"
                >
                  <XStack gap="$2" items="center">
                    <AlertTriangle size={18} color="$yellow10" />
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      {workerName}
                    </Text>
                  </XStack>
                  <Text fontSize="$2" color="$color10">
                    Submitted {formatDateTime(dispute.created_at)}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    Current status: {dispute.status}
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Dispute reason
                  </Text>
                  <TextArea
                    value={dispute.dispute_reason ?? ''}
                    editable={false}
                    rows={3}
                    bg="$color2"
                  />
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Dispute details
                  </Text>
                  <TextArea
                    value={dispute.dispute_details ?? ''}
                    editable={false}
                    rows={5}
                    bg="$color2"
                  />
                </YStack>

                <Separator />

                <YStack gap="$3">
                  <YStack gap="$1">
                    <Label htmlFor="dispute-resolution-status">Resolution</Label>
                    <ResponsiveSelect
                      value={resolutionStatus}
                      onValueChange={(value) =>
                        setResolutionStatus(value as (typeof RESOLUTION_STATUSES)[number]['value'])
                      }
                      placeholder="Select resolution"
                      label="Resolution"
                      options={RESOLUTION_STATUSES.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                    />
                  </YStack>

                  <YStack gap="$1">
                    <Label htmlFor="dispute-resolution-notes">Resolution notes</Label>
                    <TextArea
                      id="dispute-resolution-notes"
                      rows={4}
                      placeholder="Outline findings and supporting evidence used to reach this decision."
                      value={resolutionNotes}
                      onChangeText={setResolutionNotes}
                    />
                  </YStack>
                </YStack>
              </YStack>
            ) : (
              <YStack gap="$3" items="center" justify="center" py="$6">
                <Spinner size="large" />
                <Text fontSize="$3" color="$color10">
                  Loading dispute…
                </Text>
              </YStack>
            )}

            <Separator />

            <XStack gap="$2" justify="flex-end">
              <Dialog.Close asChild>
                <Button size="$3" variant="outlined" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                size="$3"
                theme="blue"
                onPress={handleResolve}
                disabled={!dispute || isSubmitting}
              >
                {isSubmitting ? (
                  <XStack gap="$2" items="center">
                    <Spinner size="small" color="$color1" />
                    <Text color="$color1">Resolving…</Text>
                  </XStack>
                ) : (
                  'Resolve dispute'
                )}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
