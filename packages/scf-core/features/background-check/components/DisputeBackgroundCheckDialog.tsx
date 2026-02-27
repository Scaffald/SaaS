import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo } from 'react'
import { DialogCompound as Dialog } from '@scf/core/components/ui/DialogCompound'
import { Button, Separator, Text, Row, Stack } from '@scaffald/ui'
import { useDispute } from '../hooks/useDispute'
import { DisputeForm } from './DisputeForm'
import { DisputeStatusTracker } from './DisputeStatusTracker'
import { getStatusMetadata } from './status.utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckSummary = RouterOutputs['backgroundChecks']['listChecks'][number]

interface DisputeBackgroundCheckDialogProps {
  check: BackgroundCheckSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted: () => void
}

export function DisputeBackgroundCheckDialog({
  check,
  open,
  onOpenChange,
  onSubmitted,
}: DisputeBackgroundCheckDialogProps) {
  const {
    form,
    reasonOptions,
    attachments,
    addAttachment,
    removeAttachment,
    submitDispute,
    reset,
    isSubmitting,
    isUploading,
    attachmentError,
    submissionError,
    disputes,
    isLoadingDisputes,
    hasActiveDispute,
    refetchDisputes,
  } = useDispute({
    checkId: check?.id ?? null,
    enabled: open,
  })

  const statusMeta = useMemo(() => {
    if (!check) return null
    return getStatusMetadata(check.status as never)
  }, [check])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const handleSubmit = async () => {
    const success = await submitDispute()
    if (success) {
      onSubmitted()
    }
    return success
  }

  const summaryPackage =
    check?.package?.display_name ?? check?.package?.slug ?? 'Background check package'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          style={{ opacity: 0.5 }}
        />
        <Dialog.Content
          key="content"
          style={{ width: '90%', maxWidth: 520 }}
        >
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Dialog.Title>Dispute background check</Dialog.Title>
              <Dialog.Close asChild>
                <Button size="sm" variant="outline" disabled={isSubmitting || isUploading}>
                  Close
                </Button>
              </Dialog.Close>
            </Row>

            {check ? (
              <Stack gap={8} style={{ borderRadius: 16, padding: 8 }}>
                <Row gap={8} align="center">
                  <AlertTriangle size={18} color="#b45309" />
                  <Text style={{ color: '#414e62' }}>{statusMeta?.label ?? 'Background check'}</Text>
                </Row>
                <Text style={{ color: '#414e62' }}>
                  Package: <Text style={{ color: '#414e62' }}>{summaryPackage}</Text>
                </Text>
                <Text style={{ color: '#414e62' }}>Completed: {formatDate(check.completed_at)}</Text>
                <Text style={{ color: '#414e62' }}>Expires: {formatDate(check.expires_at)}</Text>
                <Text style={{ color: '#414e62' }}>
                  Disputes should focus on factual inaccuracies, missing context, or mismatched
                  records.
                </Text>
              </Stack>
            ) : null}

            {check ? (
              <>
                <DisputeStatusTracker
                  disputes={disputes}
                  isLoading={isLoadingDisputes}
                  onRefresh={refetchDisputes}
                />

                <Separator />

                <DisputeForm
                  form={form}
                  reasonOptions={reasonOptions}
                  attachments={attachments}
                  onSelectAttachment={addAttachment}
                  onRemoveAttachment={removeAttachment}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  isUploading={isUploading}
                  attachmentError={attachmentError}
                  submissionError={submissionError}
                  hasActiveDispute={hasActiveDispute}
                />
              </>
            ) : (
              <Stack gap={12} align="center" style={{ paddingVertical: 24 }}>
                <Text style={{ color: '#414e62' }}>
                  Select a background check to review dispute information.
                </Text>
              </Stack>
            )}
          </Stack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
