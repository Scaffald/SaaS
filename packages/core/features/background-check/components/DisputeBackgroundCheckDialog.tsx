import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from '@tamagui/lucide-icons'
import {
  Button,
  Dialog,
  Input,
  Label,
  Separator,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from '@app/supabase/client-types'
import { api } from '@app/core/utils/api'
import { formatDate } from '@app/core/features/profile/utils/date-formatting'
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
  const toast = useToastController()
  const utils = api.useUtils()

  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<{ reason?: string; details?: string }>({})

  useEffect(() => {
    if (open) {
      setReason('')
      setDetails('')
      setErrors({})
    }
  }, [open, check?.id])

  const submitMutation = api.backgroundChecks.submitDispute.useMutation({
    onSuccess: async () => {
      toast.show('Dispute submitted', {
        message: 'Our compliance team will review your request shortly.',
      })
      await utils.backgroundChecks.listChecks.invalidate()
      onSubmitted()
    },
    onError: (error: unknown) => {
      toast.show('Unable to submit dispute', {
        message: error instanceof Error ? error.message : 'Please try again soon.',
        type: 'error',
      })
    },
  })

  const statusMeta = useMemo(() => {
    if (!check) return null
    return getStatusMetadata(check.status)
  }, [check])

  const handleSubmit = async () => {
    if (!check) return

    const validationErrors: typeof errors = {}
    if (!reason.trim()) {
      validationErrors.reason = 'Provide a brief summary of the issue.'
    }
    if (!details.trim()) {
      validationErrors.details = 'Describe what is incorrect or missing.'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await submitMutation.mutateAsync({
      background_check_id: check.id,
      dispute_reason: reason.trim(),
      dispute_details: details.trim(),
    })
  }

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
          <YStack gap="$4">
            <XStack justify="space-between" items="center">
              <Dialog.Title fontSize="$6" fontWeight="700">
                Dispute background check
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button size="$2" variant="outlined" disabled={submitMutation.isLoading}>
                  Close
                </Button>
              </Dialog.Close>
            </XStack>

            {check ? (
              <YStack gap="$2" bg="$color3" p="$3" rounded="$4">
                <XStack gap="$2" items="center">
                  <AlertTriangle size={18} color="$yellow10" />
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    {statusMeta?.label ?? 'Background check'}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$color10">
                  Package:{' '}
                  <Text fontWeight="600" color="$color12">
                    {check.package?.display_name ?? check.package?.slug ?? 'Unknown package'}
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
              </YStack>
            ) : null}

            <Separator />

            <YStack gap="$3">
              <YStack gap="$1">
                <Label htmlFor="dispute-reason">What needs review?</Label>
                <Input
                  id="dispute-reason"
                  placeholder="Incorrect criminal record, missing certification, etc."
                  value={reason}
                  onChangeText={(value) => {
                    setReason(value)
                    if (errors.reason) {
                      setErrors((prev) => ({ ...prev, reason: undefined }))
                    }
                  }}
                />
                {errors.reason ? (
                  <Text fontSize="$2" color="$red10">
                    {errors.reason}
                  </Text>
                ) : null}
              </YStack>

              <YStack gap="$1">
                <Label htmlFor="dispute-details">Explain the issue</Label>
                <TextArea
                  id="dispute-details"
                  rows={6}
                  placeholder="Share specific details, dates, or supporting context to investigate."
                  value={details}
                  onChangeText={(value) => {
                    setDetails(value)
                    if (errors.details) {
                      setErrors((prev) => ({ ...prev, details: undefined }))
                    }
                  }}
                />
                {errors.details ? (
                  <Text fontSize="$2" color="$red10">
                    {errors.details}
                  </Text>
                ) : null}
              </YStack>

              <Text fontSize="$2" color="$color10">
                We will share this dispute with the background check provider. Expect an update within 5 business days.
              </Text>
            </YStack>

            <XStack gap="$2" justify="flex-end">
              <Dialog.Close asChild>
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={submitMutation.isLoading}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                size="$3"
                theme="blue"
                onPress={handleSubmit}
                disabled={submitMutation.isLoading}
              >
                {submitMutation.isLoading ? (
                  <XStack gap="$2" items="center">
                    <Spinner size="small" color="$color1" />
                    <Text color="$color1">Submitting…</Text>
                  </XStack>
                ) : (
                  'Submit dispute'
                )}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

