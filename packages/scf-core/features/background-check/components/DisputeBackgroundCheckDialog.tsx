import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo } from 'react'
import { Button, Dialog, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="content"
          bordered
          elevate
          animation="quick"
          enterStyle={{ y: -10, opacity: 0 }}
          exitStyle={{ y: -10, opacity: 0 }}
          style={{ width: '90%', maxWidth: 520 }}
        >
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Dialog.Title>Dispute background check</Dialog.Title>
              <Dialog.Close asChild>
                <Button size="xs" variant="outline" disabled={isSubmitting || isUploading}>
                  Close
                </Button>
              </Dialog.Close>
            </Row>

            {check ? (
              <Stack gap={8} backgroundColor="$color3" padding="sm" borderRadius={16}>
                <Row gap={8} align="center">
                  <AlertTriangle size={18} color="$yellow10" />
                  <Text color="$gray11">{statusMeta?.label ?? 'Background check'}</Text>
                </Row>
                <Text color="$gray11">
                  Package: <Text color="$gray11">{summaryPackage}</Text>
                </Text>
                <Text color="$gray11">Completed: {formatDate(check.completed_at)}</Text>
                <Text color="$gray11">Expires: {formatDate(check.expires_at)}</Text>
                <Text color="$gray11">
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
              <Stack gap={12} align="center" paddingVertical={24}>
                <Text color="$gray11">
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
