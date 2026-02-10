import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import {
  Button,
  Dialog,
  Label,
  Separator,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

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
  const toast = useToast()
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
      toast.show({
          title: 'Dispute resolved',
          message: 'The worker and requester will receive notifications shortly.',
        })
      await Promise.all([
        utils.backgroundChecks.adminListDisputes.invalidate(),
        utils.backgroundChecks.adminListChecks.invalidate(),
      ])
      onResolved()
    },
    onError: (error: unknown) => {
      toast.show({
          title: 'Unable to resolve dispute',
          message: error instanceof Error ? error.message : 'Please try again shortly.',
          variant: 'error',
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
          <Stack gap="$4">
            <Row justifyContent="space-between" alignItems="center">
              <Dialog.Title fontSize="$6" fontWeight="700">
                Resolve dispute
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button size="$2" variant="outlined" disabled={isSubmitting}>
                  Close
                </Button>
              </Dialog.Close>
            </Row>

            {dispute ? (
              <Stack gap="$3">
                <Stack
                  gap="$2"
                  padding="$3"
                  backgroundColor="$color2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                >
                  <Row gap="$2" alignItems="center">
                    <AlertTriangle size={18} color="$yellow10" />
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      {workerName}
                    </Text>
                  </Row>
                  <Text fontSize="$2" color="$color10">
                    Submitted {formatDateTime(dispute.created_at)}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    Current status: {dispute.status}
                  </Text>
                </Stack>

                <Stack gap="$2">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Dispute reason
                  </Text>
                  <TextArea
                    value={dispute.dispute_reason ?? ''}
                    editable={false}
                    rows={3}
                    backgroundColor="$color2"
                  />
                </Stack>

                <Stack gap="$2">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Dispute details
                  </Text>
                  <TextArea
                    value={dispute.dispute_details ?? ''}
                    editable={false}
                    rows={5}
                    backgroundColor="$color2"
                  />
                </Stack>

                <Separator />

                <Stack gap="$3">
                  <Stack gap="$1">
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
                  </Stack>

                  <Stack gap="$1">
                    <Label htmlFor="dispute-resolution-notes">Resolution notes</Label>
                    <TextArea
                      id="dispute-resolution-notes"
                      rows={4}
                      placeholder="Outline findings and supporting evidence used to reach this decision."
                      value={resolutionNotes}
                      onChangeText={setResolutionNotes}
                    />
                  </Stack>
                </Stack>
              </Stack>
            ) : (
              <Stack gap="$3" alignItems="center" justifyContent="center" paddingVertical="$6">
                <Spinner size="large" />
                <Text fontSize="$3" color="$color10">
                  Loading dispute…
                </Text>
              </Stack>
            )}

            <Separator />

            <Row gap="$2" justifyContent="flex-end">
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
                  <Row gap="$2" alignItems="center">
                    <Spinner size="small" color="$color1" />
                    <Text color="$color1">Resolving…</Text>
                  </Row>
                ) : (
                  'Resolve dispute'
                )}
              </Button>
            </Row>
          </Stack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
