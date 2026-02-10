import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { Button, Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useDispute } from '../hooks/useDispute'
import { DisputeForm } from './DisputeForm'
import { DisputeStatusTracker } from './DisputeStatusTracker'
import { getStatusMetadata } from './status.utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type BackgroundCheckSummary = RouterOutputs['backgroundChecks']['listChecks'][number]

interface DisputeBackgroundCheckContentProps {
  check: BackgroundCheckSummary | null
  isActive: boolean
  onSubmitted: () => void
  onClose?: () => void
  renderHeaderAction?: (state: { isSubmitting: boolean; isUploading: boolean }) => ReactNode
}

export function DisputeBackgroundCheckContent({
  check,
  isActive,
  onSubmitted,
  onClose,
  renderHeaderAction,
}: DisputeBackgroundCheckContentProps) {
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
    enabled: isActive && Boolean(check?.id),
  })

  const statusMeta = useMemo(() => {
    if (!check) return null
    return getStatusMetadata(check.status as never)
  }, [check])

  useEffect(() => {
    if (!isActive) {
      reset()
    }
  }, [isActive, reset])

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
    <Stack gap="$4">
      <Row justifyContent="space-between" alignItems="center">
        <Stack gap="$1">
          <Text fontSize="$6" fontWeight="700">
            Dispute background check
          </Text>
          <Text fontSize="$2" color="$color10">
            Flag inaccurate information so our compliance team can investigate.
          </Text>
        </Stack>
        {(renderHeaderAction?.({ isSubmitting, isUploading }) as ReactNode) ?? (
          <Button
            size="$2"
            variant="outlined"
            disabled={isSubmitting || isUploading}
            onPress={onClose}
          >
            Close
          </Button>
        )}
      </Row>

      {check ? (
        <>
          <Stack gap="$2" backgroundColor="$color3" padding="$3" borderRadius="$4">
            <Row gap="$2" alignItems="center">
              <AlertTriangle size={18} color="$yellow10" />
              <Text fontSize="$3" fontWeight="600" color="$color12">
                {statusMeta?.label ?? 'Background check'}
              </Text>
            </Row>
            <Text fontSize="$2" color="$color10">
              Package:{' '}
              <Text fontWeight="600" color="$color12">
                {summaryPackage}
              </Text>
            </Text>
            <Text fontSize="$2" color="$color10">
              Completed: {formatDate(check.completed_at)}
            </Text>
            <Text fontSize="$2" color="$color10">
              Expires: {formatDate(check.expires_at)}
            </Text>
            <Text fontSize="$2" color="$color10">
              Disputes should focus on factual inaccuracies, missing context, or mismatched records.
            </Text>
          </Stack>

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
        <Stack gap="$3" alignItems="center" paddingVertical="$6">
          <Text fontSize="$3" color="$color10">
            Select a background check to review dispute information.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
