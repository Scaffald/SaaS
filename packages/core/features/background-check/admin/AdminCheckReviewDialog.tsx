import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, History } from '@tamagui/lucide-icons'
import {
  Button,
  Dialog,
  Input,
  Label,
  Select,
  Separator,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'

import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'

import {
  BACKGROUND_CHECK_STATUSES,
  getStatusMetadata,
  type BackgroundCheckStatus,
} from '../components/status.utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type AdminCheckSummary = RouterOutputs['backgroundChecks']['adminListChecks'][number]

type StatusHistoryEntry = {
  status?: string | null
  occurred_at?: string | null
  notes?: string | null
  reviewer_user_id?: string | null
  actor?: string | null
}

const STATUS_OPTIONS: BackgroundCheckStatus[] = BACKGROUND_CHECK_STATUSES.filter(
  (status) => status !== 'disputed',
)

interface AdminCheckReviewDialogProps {
  check: AdminCheckSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

const dateToInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function safeJson(value: unknown) {
  if (!value) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function AdminCheckReviewDialog({
  check,
  open,
  onOpenChange,
  onUpdated,
}: AdminCheckReviewDialogProps) {
  const toast = useToastController()
  const utils = api.useUtils()

  const [status, setStatus] = useState<BackgroundCheckStatus>('under_review')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (check && open) {
      setStatus(check.status)
      setSummary(check.summary ?? '')
      setExpiresAt(dateToInputValue(check.expires_at))
      setNotes('')
    }
  }, [check, open])

  const statusMeta = useMemo(() => {
    if (!check) return null
    return getStatusMetadata(check.status as BackgroundCheckStatus)
  }, [check])

  const mutation = api.backgroundChecks.adminUpdateStatus.useMutation({
    onSuccess: async () => {
      toast.show('Background check updated', {
        message: 'Status changes have been saved and notifications queued.',
      })
      await Promise.all([
        utils.backgroundChecks.adminListChecks.invalidate(),
        utils.backgroundChecks.adminListDisputes.invalidate(),
      ])
      onUpdated()
    },
    onError: (error: unknown) => {
      toast.show('Unable to update background check', {
        message: error instanceof Error ? error.message : 'Please try again shortly.',
        type: 'error',
      })
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = () => {
    if (!check || isSubmitting) return
    setIsSubmitting(true)
    mutation.mutate({
      background_check_id: check.id,
      status,
      summary: summary.trim() ? summary.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
  }

  const statusHistory = useMemo<StatusHistoryEntry[]>(() => {
    if (!Array.isArray(check?.status_history)) return []
    return (check?.status_history as StatusHistoryEntry[]) ?? []
  }, [check?.status_history])

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
          style={{ width: '96%', maxWidth: 780, maxHeight: '85%' }}
        >
          <YStack gap="$4">
            <XStack justify="space-between" items="center" flexWrap="wrap" gap="$3">
              <Dialog.Title fontSize="$6" fontWeight="700">
                Review background check
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button size="$2" variant="outlined" disabled={isSubmitting}>
                  Close
                </Button>
              </Dialog.Close>
            </XStack>

            {check ? (
              <YStack gap="$3">
                <YStack
                  bg="$color2"
                  borderColor="$borderColor"
                  borderWidth={1}
                  rounded="$4"
                  p="$3"
                  gap="$2"
                >
                  <XStack gap="$3" items="center" flexWrap="wrap">
                    <CheckCircle2 size={18} color="$color11" />
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      {check.worker?.display_name ?? check.worker?.username ?? 'Worker'}
                    </Text>
                    {check.organization?.name ? (
                      <Text fontSize="$2" color="$color10">
                        • {check.organization.name}
                      </Text>
                    ) : null}
                  </XStack>
                  <Text fontSize="$2" color="$color10">
                    Package:{' '}
                    <Text fontWeight="600" color="$color12">
                      {check.package?.display_name ?? check.package?.slug ?? 'Unknown package'}
                    </Text>
                  </Text>
                  {statusMeta ? (
                    <Text fontSize="$2" color="$color10">
                      Current status: {statusMeta.label}
                    </Text>
                  ) : null}
                </YStack>

                <Separator />

                <YStack gap="$3">
                  <YStack gap="$1">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as BackgroundCheckStatus)}
                      disablePreventBodyScroll
                    >
                      <Select.Trigger iconAfter={History}>
                        <Select.Value placeholder="Select status" />
                      </Select.Trigger>
                      <Select.Content zIndex={200_000}>
                        <Select.ScrollUpButton />
                        <Select.Viewport>
                          <Select.Group>
                            <Select.Label>Status</Select.Label>
                            {STATUS_OPTIONS.map((option, index) => {
                              const meta = getStatusMetadata(option)
                              return (
                                <Select.Item key={option} value={option} index={index}>
                                  <Select.ItemText>{meta.label}</Select.ItemText>
                                  <Select.ItemIndicator>
                                    <CheckCircle2 size={16} />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              )
                            })}
                          </Select.Group>
                        </Select.Viewport>
                        <Select.ScrollDownButton />
                      </Select.Content>
                    </Select>
                  </YStack>

                  <YStack gap="$1">
                    <Label htmlFor="admin-check-summary">Summary</Label>
                    <TextArea
                      id="admin-check-summary"
                      rows={4}
                      value={summary}
                      onChangeText={setSummary}
                      placeholder="Provide a concise summary of the findings and decision."
                    />
                  </YStack>

                  <YStack gap="$1">
                    <Label htmlFor="admin-check-notes">Internal notes</Label>
                    <TextArea
                      id="admin-check-notes"
                      rows={3}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Optional internal notes. These are stored with the status history."
                    />
                  </YStack>

                  <YStack gap="$1">
                    <Label htmlFor="admin-check-expires">Expiration (UTC)</Label>
                    <Input
                      id="admin-check-expires"
                      placeholder="YYYY-MM-DD"
                      value={expiresAt}
                      onChangeText={setExpiresAt}
                    />
                    <Text fontSize="$1" color="$color9">
                      Leave blank to clear expiration.
                    </Text>
                  </YStack>
                </YStack>

                <Separator />

                <YStack gap="$3">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Provider summary
                  </Text>
                  <TextArea
                    rows={6}
                    value={safeJson(check.summary)}
                    editable={false}
                    bg="$color2"
                  />
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Provider findings
                  </Text>
                  <TextArea
                    rows={6}
                    value={safeJson(check.findings)}
                    editable={false}
                    bg="$color2"
                  />
                </YStack>

                {statusHistory.length > 0 ? (
                  <>
                    <Separator />
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="600" color="$color12">
                        Status history
                      </Text>
                      <YStack gap="$2" overflow="scroll" style={{ maxHeight: 200 }}>
                        {statusHistory
                          .slice()
                          .reverse()
                          .map((entry, index) => {
                            const meta = entry?.status ? getStatusMetadata(entry.status as BackgroundCheckStatus) : null
                            return (
                              <YStack
                                key={`${entry?.occurred_at ?? index}`}
                                borderWidth={1}
                                borderColor="$borderColor"
                                rounded="$4"
                                p="$3"
                                gap="$1"
                                bg="$color2"
                              >
                                <Text fontSize="$2" fontWeight="600" color="$color12">
                                  {meta?.label ?? entry?.status ?? 'Status update'}
                                </Text>
                                <Text fontSize="$1" color="$color10">
                                  {entry?.occurred_at
                                    ? new Date(entry.occurred_at).toLocaleString()
                                    : '—'}
                                </Text>
                                {entry?.notes ? (
                                  <Text fontSize="$2" color="$color10">
                                    Notes: {entry.notes}
                                  </Text>
                                ) : null}
                              </YStack>
                            )
                          })}
                      </YStack>
                    </YStack>
                  </>
                ) : null}
              </YStack>
            ) : (
              <YStack gap="$3" items="center" justify="center" py="$6">
                <Spinner size="large" />
                <Text fontSize="$3" color="$color10">
                  Loading background check…
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
                onPress={handleSubmit}
                disabled={!check || isSubmitting}
              >
                {isSubmitting ? (
                  <XStack gap="$2" items="center">
                    <Spinner size="small" color="$color1" />
                    <Text color="$color1">Saving…</Text>
                  </XStack>
                ) : (
                  'Save changes'
                )}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

