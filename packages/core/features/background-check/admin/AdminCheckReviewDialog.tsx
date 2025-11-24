import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { Button, Dialog } from '@app/ui'
import { CheckCircle2, DownloadCloud, RefreshCcw } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking } from 'react-native'
import { ResponsiveSelect } from '@app/ui'
import {
  Input,
  Label,
  Separator,
  Spinner,
  Switch,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import { CheckProgressTracker } from '../components/CheckProgressTracker'
import {
  BACKGROUND_CHECK_STATUSES,
  type BackgroundCheckStatus,
  getStatusMetadata,
  getStatusToneColors,
} from '../components/status.utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type AdminCheckSummary = RouterOutputs['backgroundChecks']['adminListChecks'][number]
type AdminCheckDetail = RouterOutputs['backgroundChecks']['adminGetCheck']
type AdminCheckDocument = AdminCheckDetail['documents'][number]
type AdminCheckDispute = AdminCheckDetail['disputes'][number]

type StatusHistoryEntry = {
  status?: string | null
  occurred_at?: string | null
  notes?: string | null
  reviewer_user_id?: string | null
  actor?: string | null
}

const STATUS_OPTIONS: BackgroundCheckStatus[] = BACKGROUND_CHECK_STATUSES.filter(
  (status) => status !== 'disputed'
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

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

type PrivacyState = {
  sharePublicly: boolean
  sharedOrganizationIds: string[]
}

const parsePrivacySettings = (metadata: unknown): PrivacyState => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {
      sharePublicly: false,
      sharedOrganizationIds: [],
    }
  }

  const record = metadata as Record<string, unknown>
  if (!('privacy' in record)) {
    return {
      sharePublicly: false,
      sharedOrganizationIds: [],
    }
  }

  const privacy = record.privacy
  if (!privacy || typeof privacy !== 'object' || Array.isArray(privacy)) {
    return {
      sharePublicly: false,
      sharedOrganizationIds: [],
    }
  }

  const privacyRecord = privacy as Record<string, unknown>
  return {
    sharePublicly: Boolean(privacyRecord.share_publicly),
    sharedOrganizationIds: Array.isArray(privacyRecord.shared_with_organization_ids)
      ? (privacyRecord.shared_with_organization_ids as string[])
      : [],
  }
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
  const checkId = check?.id ?? null

  const detailQuery = api.backgroundChecks.adminGetCheck.useQuery(
    { background_check_id: checkId ?? '' },
    {
      enabled: open && Boolean(checkId),
      refetchOnWindowFocus: false,
    }
  )

  const detailedCheck = detailQuery.data?.check ?? null
  const documents: AdminCheckDocument[] = detailQuery.data?.documents ?? []
  const disputes: AdminCheckDispute[] = detailQuery.data?.disputes ?? []

  const [status, setStatus] = useState<BackgroundCheckStatus>('under_review')
  const [summary, setSummary] = useState('')
  const [notes, setNotes] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sharePublicly, setSharePublicly] = useState(false)
  const [sharedOrganizations, setSharedOrganizations] = useState<string[]>([])

  useEffect(() => {
    if (detailedCheck && open) {
      setStatus(detailedCheck.status)
      setSummary(detailedCheck.summary ?? '')
      setExpiresAt(dateToInputValue(detailedCheck.expires_at))
      setNotes('')
      const privacy = parsePrivacySettings(detailedCheck.metadata)
      setSharePublicly(privacy.sharePublicly)
      setSharedOrganizations(privacy.sharedOrganizationIds)
    } else if (!open) {
      setNotes('')
    }
  }, [detailedCheck, open])

  const statusMeta = useMemo(() => {
    if (!detailedCheck) return null
    return getStatusMetadata(detailedCheck.status as BackgroundCheckStatus)
  }, [detailedCheck])

  const statusColors = useMemo(() => {
    if (!statusMeta) return null
    return getStatusToneColors(statusMeta.tone)
  }, [statusMeta])

  const mutation = api.backgroundChecks.adminUpdateStatus.useMutation({
    onSuccess: async () => {
      toast.show('Background check updated', {
        message: 'Status changes have been saved and notifications queued.',
      })
      await Promise.all([
        utils.backgroundChecks.adminListChecks.invalidate(),
        utils.backgroundChecks.adminListDisputes.invalidate(),
        checkId
          ? utils.backgroundChecks.adminGetCheck.invalidate({
              background_check_id: checkId,
            })
          : Promise.resolve(),
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
    if (!detailedCheck || isSubmitting) return
    setIsSubmitting(true)
    mutation.mutate({
      background_check_id: detailedCheck.id,
      status,
      summary: summary.trim() ? summary.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
  }

  const statusHistory = useMemo<StatusHistoryEntry[]>(() => {
    if (!Array.isArray(detailedCheck?.status_history)) return []
    return (detailedCheck?.status_history as StatusHistoryEntry[]) ?? []
  }, [detailedCheck?.status_history])

  const privacyMutation = api.backgroundChecks.adminUpdatePrivacy.useMutation()

  const documentDownloadMutation = api.backgroundChecks.adminGetDocumentDownloadUrl.useMutation()

  const handlePrivacyUpdate = useCallback(
    (nextSharePublicly: boolean, nextOrgIds: string[]) => {
      if (!detailedCheck) return
      const previousShare = sharePublicly
      const previousOrgIds = sharedOrganizations

      setSharePublicly(nextSharePublicly)
      setSharedOrganizations(nextOrgIds)

      privacyMutation.mutate(
        {
          background_check_id: detailedCheck.id,
          share_publicly: nextSharePublicly,
          shared_with_organization_ids: nextOrgIds,
        },
        {
          onSuccess: async () => {
            toast.show('Privacy settings updated', {
              message: 'Visibility preferences have been saved.',
            })
            await utils.backgroundChecks.adminGetCheck.invalidate({
              background_check_id: detailedCheck.id,
            })
          },
          onError: (error: unknown) => {
            setSharePublicly(previousShare)
            setSharedOrganizations(previousOrgIds)
            toast.show('Unable to update privacy settings', {
              message: error instanceof Error ? error.message : 'Please try again shortly.',
              type: 'error',
            })
          },
        }
      )
    },
    [
      detailedCheck,
      privacyMutation,
      sharePublicly,
      sharedOrganizations,
      toast,
      utils.backgroundChecks.adminGetCheck,
    ]
  )

  const openSignedUrl = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    void Linking.openURL(url)
  }, [])

  const handleDownloadDocument = useCallback(
    (documentId: string) => {
      if (!detailedCheck) return
      documentDownloadMutation.mutate(
        { document_id: documentId },
        {
          onSuccess: ({ signedUrl }: { signedUrl: string }) => {
            toast.show('Document ready', {
              message: 'Opening the document in a new window.',
            })
            openSignedUrl(signedUrl)
          },
          onError: (error: unknown) => {
            toast.show('Unable to open document', {
              message: error instanceof Error ? error.message : 'Please try again shortly.',
              type: 'error',
            })
          },
        }
      )
    },
    [documentDownloadMutation, detailedCheck, openSignedUrl, toast]
  )

  const isPrivacySaving = privacyMutation.isPending
  const isDownloadingDocument = documentDownloadMutation.isPending
  const downloadingDocumentId = documentDownloadMutation.variables?.document_id

  const workerName = useMemo(() => {
    if (!detailedCheck?.worker) return 'Worker'
    const worker = detailedCheck.worker
    if (worker.display_name?.trim()) return worker.display_name.trim()
    if (worker.username?.trim()) return worker.username.trim()
    if (worker.id) return `User ${worker.id.slice(0, 8)}`
    return 'Worker'
  }, [detailedCheck?.worker])

  const workerEmail = detailedCheck?.worker?.email ?? null
  const organizationName = detailedCheck?.organization?.name ?? null

  const packageLabel = useMemo(() => {
    const checkWithPackage = detailedCheck as typeof detailedCheck & {
      package?: { display_name?: string | null; slug?: string | null } | null
    }
    if (!checkWithPackage?.package) return 'Background check'
    return checkWithPackage.package.display_name ?? checkWithPackage.package.slug ?? 'Background check'
  }, [detailedCheck])

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

            {!checkId ? (
              <YStack gap="$3" items="center" justify="center" py="$6">
                <Text fontSize="$3" color="$color10">
                  Select a background check to review the full details.
                </Text>
              </YStack>
            ) : detailQuery.isLoading || detailQuery.isFetching ? (
              <YStack gap="$3" items="center" justify="center" py="$6">
                <Spinner size="large" />
                <Text fontSize="$3" color="$color10">
                  Loading background check…
                </Text>
              </YStack>
            ) : detailQuery.isError ? (
              <YStack
                gap="$3"
                p="$4"
                bg="$color2"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize="$3" color="$color11">
                  We couldn't load this background check. Please try again.
                </Text>
                <Button size="$3" variant="outlined" onPress={() => detailQuery.refetch()}>
                  <XStack gap="$2" items="center">
                    <RefreshCcw size={16} />
                    <Text fontSize="$2">Retry</Text>
                  </XStack>
                </Button>
              </YStack>
            ) : !detailedCheck ? (
              <YStack gap="$3" items="center" justify="center" py="$6">
                <Spinner size="large" />
                <Text fontSize="$3" color="$color10">
                  Preparing detailed background check information…
                </Text>
              </YStack>
            ) : (
              <YStack gap="$4">
                <YStack
                  gap="$3"
                  p="$3"
                  bg="$color2"
                  rounded="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <YStack gap="$1">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      {workerName}
                    </Text>
                    {workerEmail ? (
                      <Text fontSize="$2" color="$color10">
                        {workerEmail}
                      </Text>
                    ) : null}
                    {organizationName ? (
                      <Text fontSize="$2" color="$color10">
                        Organization: {organizationName}
                      </Text>
                    ) : null}
                  </YStack>
                  <XStack gap="$3" flexWrap="wrap">
                    <Text fontSize="$2" color="$color10">
                      Package:{' '}
                      <Text fontWeight="600" color="$color12">
                        {packageLabel}
                      </Text>
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      Created: {formatDateTime(detailedCheck.created_at)}
                    </Text>
                    {(() => {
                      const checkWithCompletedAt = detailedCheck as typeof detailedCheck & {
                        completed_at?: string | null
                      }
                      const completedAt = checkWithCompletedAt.completed_at
                      if (!completedAt) return null
                      return (
                        <Text fontSize="$2" color="$color10">
                          Completed: {formatDateTime(completedAt)}
                        </Text>
                      )
                    })()}
                    {detailedCheck.expires_at ? (
                      <Text fontSize="$2" color="$color10">
                        Expires: {formatDateTime(detailedCheck.expires_at)}
                      </Text>
                    ) : null}
                  </XStack>
                  {statusMeta && statusColors ? (
                    <XStack
                      px="$3"
                      py="$1"
                      bg={statusColors.background}
                      borderWidth={1}
                      borderColor={statusColors.border}
                      rounded="$3"
                      items="center"
                      gap="$2"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <CheckCircle2 size={16} color={statusColors.text} />
                      <Text fontSize="$2" fontWeight="600" color={statusColors.text}>
                        {statusMeta.label}
                      </Text>
                    </XStack>
                  ) : null}
                </YStack>

                <CheckProgressTracker
                  status={detailedCheck.status}
                  createdAt={detailedCheck.created_at}
                  componentStatuses={detailedCheck.component_statuses}
                  statusHistory={detailedCheck.status_history}
                  estimatedCompletionDate={detailedCheck.estimated_completion_date}
                  completedAt={
                    (detailedCheck as typeof detailedCheck & { completed_at?: string | null })
                      .completed_at ?? null
                  }
                  expiresAt={detailedCheck.expires_at ?? null}
                />

                <Separator />

                <YStack gap="$3">
                  <YStack gap="$1">
                    <Label>Status</Label>
                    <ResponsiveSelect
                      value={status}
                      onValueChange={(value) => setStatus(value as BackgroundCheckStatus)}
                      placeholder="Select status"
                      label="Status"
                      options={STATUS_OPTIONS.map((option) => {
                        const meta = getStatusMetadata(option)
                        return {
                          value: option,
                          label: meta.label,
                        }
                      })}
                    />
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
                    value={safeJson(detailedCheck.summary)}
                    editable={false}
                    bg="$color2"
                  />
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Provider findings
                  </Text>
                  <TextArea
                    rows={6}
                    value={safeJson(detailedCheck.findings)}
                    editable={false}
                    bg="$color2"
                  />
                </YStack>

                <Separator />

                <YStack gap="$3">
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      Supporting documents
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </Text>
                  </XStack>

                  {documents.length === 0 ? (
                    <Text fontSize="$2" color="$color10">
                      No documents uploaded for this background check.
                    </Text>
                  ) : (
                    <YStack gap="$2">
                      {documents.map((document) => {
                        const isDocumentLoading =
                          isDownloadingDocument && downloadingDocumentId === document.id
                        return (
                          <XStack
                            key={document.id}
                            justify="space-between"
                            items="center"
                            p="$3"
                            bg="$color2"
                            rounded="$3"
                            borderWidth={1}
                            borderColor="$borderColor"
                            gap="$3"
                          >
                            <YStack gap="$1" flex={1}>
                              <Text fontSize="$3" fontWeight="500" color="$color12">
                                {document.file_name ?? document.document_type ?? 'Document'}
                              </Text>
                              <Text fontSize="$2" color="$color10">
                                Uploaded {formatDateTime(document.uploaded_at)}
                              </Text>
                            </YStack>
                            <Button
                              size="$2"
                              variant="outlined"
                              disabled={isDocumentLoading}
                              onPress={() => handleDownloadDocument(document.id)}
                            >
                              <XStack gap="$2" items="center">
                                {isDocumentLoading ? (
                                  <Spinner size="small" />
                                ) : (
                                  <DownloadCloud size={16} />
                                )}
                                <Text fontSize="$2">
                                  {isDocumentLoading ? 'Preparing…' : 'View'}
                                </Text>
                              </XStack>
                            </Button>
                          </XStack>
                        )
                      })}
                    </YStack>
                  )}
                </YStack>

                <Separator />

                <YStack gap="$3">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Privacy controls
                  </Text>

                  <YStack
                    gap="$3"
                    p="$3"
                    bg="$color2"
                    rounded="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <XStack justify="space-between" items="center">
                      <YStack gap="$1" flex={1} pr="$3">
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          Show verified badge
                        </Text>
                        <Text fontSize="$2" color="$color10">
                          Allow organizations to see that this worker's background check is current.
                        </Text>
                      </YStack>
                      <Switch
                        size="$3"
                        checked={sharePublicly}
                        onCheckedChange={(value) =>
                          handlePrivacyUpdate(Boolean(value), sharedOrganizations)
                        }
                        disabled={isPrivacySaving}
                      >
                        <Switch.Thumb />
                      </Switch>
                    </XStack>
                  </YStack>

                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      Shared with organizations
                    </Text>
                    {sharedOrganizations.length === 0 ? (
                      <YStack
                        p="$3"
                        bg="$color2"
                        rounded="$3"
                        borderWidth={1}
                        borderColor="$borderColor"
                      >
                        <Text fontSize="$2" color="$color10">
                          No organizations currently have access to this background check.
                        </Text>
                      </YStack>
                    ) : (
                      <YStack gap="$2">
                        {sharedOrganizations.map((organizationId) => (
                          <XStack
                            key={organizationId}
                            justify="space-between"
                            items="center"
                            p="$3"
                            bg="$color2"
                            rounded="$3"
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            <Text fontSize="$2" color="$color12">
                              {organizationId}
                            </Text>
                            <Button
                              size="$2"
                              variant="outlined"
                              disabled={isPrivacySaving}
                              onPress={() =>
                                handlePrivacyUpdate(
                                  sharePublicly,
                                  sharedOrganizations.filter((id) => id !== organizationId)
                                )
                              }
                            >
                              Revoke
                            </Button>
                          </XStack>
                        ))}
                      </YStack>
                    )}
                  </YStack>
                </YStack>

                {disputes.length > 0 ? (
                  <>
                    <Separator />
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="600" color="$color12">
                        Disputes
                      </Text>
                      <YStack gap="$2">
                        {disputes.map((dispute) => (
                          <YStack
                            key={dispute.id}
                            gap="$1"
                            p="$3"
                            bg="$color2"
                            rounded="$3"
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            <Text fontSize="$2" fontWeight="600" color="$color12">
                              {dispute.status}
                            </Text>
                            <Text fontSize="$2" color="$color10">
                              Submitted {formatDateTime(dispute.created_at)}
                            </Text>
                            {dispute.resolved_at ? (
                              <Text fontSize="$2" color="$color10">
                                Resolved {formatDateTime(dispute.resolved_at)}
                              </Text>
                            ) : null}
                            {dispute.dispute_reason ? (
                              <Text fontSize="$2" color="$color10">
                                Reason: {dispute.dispute_reason}
                              </Text>
                            ) : null}
                            {dispute.dispute_details ? (
                              <Text fontSize="$2" color="$color10">
                                Details: {dispute.dispute_details}
                              </Text>
                            ) : null}
                          </YStack>
                        ))}
                      </YStack>
                    </YStack>
                  </>
                ) : null}

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
                            const meta = entry?.status
                              ? getStatusMetadata(entry.status as BackgroundCheckStatus)
                              : null
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
            )}

            <Separator />

            <XStack gap="$2" justify="flex-end">
              <Dialog.Close asChild>
                <Button size="$3" variant="outlined" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button size="$3" onPress={handleSubmit} disabled={!detailedCheck || isSubmitting}>
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
