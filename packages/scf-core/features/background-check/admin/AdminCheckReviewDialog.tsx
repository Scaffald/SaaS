import {
  useAdminCheck,
  useAdminGetDocumentDownloadUrlMutation,
  useAdminUpdatePrivacyMutation,
  useAdminUpdateStatusMutation,
} from '@scf/core/utils/background-checks-sdk-hooks'
import type {
  AdminCheckDocument,
  AdminCheckDispute,
  AdminCheckSummary,
} from '@scaffald/sdk'
import { Button, Dialog } from '@scaffald/ui'
import { CheckCircle2, DownloadCloud, RefreshCcw } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Linking } from 'react-native'
import { ResponsiveSelect } from '@scaffald/ui'
import {
  Input,
  Label,
  Separator,
  Spinner,
  Switch,
  Text,
  TextArea,
  Row,
  Stack,
} from '@scaffald/ui'
import { CheckProgressTracker } from '../components/CheckProgressTracker'
import {
  BACKGROUND_CHECK_STATUSES,
  type BackgroundCheckStatus,
  getStatusMetadata,
  getStatusToneColors,
} from '../components/status.utils'

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
  const toast = useToast()
  const checkId = check?.id ?? undefined

  const detailQuery = useAdminCheck(checkId, {
    enabled: open && Boolean(checkId),
  })

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
      setStatus(
        (typeof detailedCheck.status === 'string' ? detailedCheck.status : 'under_review') as BackgroundCheckStatus
      )
      setSummary(typeof detailedCheck.summary === 'string' ? detailedCheck.summary : '')
      setExpiresAt(
        dateToInputValue(
          typeof detailedCheck.expires_at === 'string' ? detailedCheck.expires_at : null
        )
      )
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

  const mutation = useAdminUpdateStatusMutation({
    onSuccess: () => {
      toast.show({
        title: 'Background check updated',
        message: 'Status changes have been saved and notifications queued.',
      })
      onUpdated()
    },
    onError: (error: unknown) => {
      toast.show({
        title: 'Unable to update background check',
        message: error instanceof Error ? error.message : 'Please try again shortly.',
        variant: 'error',
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
      checkId: detailedCheck.id,
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

  const privacyMutation = useAdminUpdatePrivacyMutation()

  const documentDownloadMutation = useAdminGetDocumentDownloadUrlMutation()

  const handlePrivacyUpdate = useCallback(
    (nextSharePublicly: boolean, nextOrgIds: string[]) => {
      if (!detailedCheck) return
      const previousShare = sharePublicly
      const previousOrgIds = sharedOrganizations

      setSharePublicly(nextSharePublicly)
      setSharedOrganizations(nextOrgIds)

      privacyMutation.mutate(
        {
          checkId: detailedCheck.id,
          share_publicly: nextSharePublicly,
          shared_with_organization_ids: nextOrgIds,
        },
        {
          onSuccess: () => {
            toast.show({
              title: 'Privacy settings updated',
              message: 'Visibility preferences have been saved.',
            })
          },
          onError: (error: unknown) => {
            setSharePublicly(previousShare)
            setSharedOrganizations(previousOrgIds)
            toast.show({
              title: 'Unable to update privacy settings',
              message: error instanceof Error ? error.message : 'Please try again shortly.',
              variant: 'error',
            })
          },
        }
      )
    },
    [detailedCheck, privacyMutation, sharePublicly, sharedOrganizations, toast]
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
      documentDownloadMutation.mutate(documentId, {
        onSuccess: ({ url }) => {
          toast.show({
            title: 'Document ready',
            message: 'Opening the document in a new window.',
          })
          openSignedUrl(url)
        },
        onError: (error: unknown) => {
          toast.show({
            title: 'Unable to open document',
            message: error instanceof Error ? error.message : 'Please try again shortly.',
            variant: 'error',
          })
        },
      })
    },
    [documentDownloadMutation, detailedCheck, openSignedUrl, toast]
  )

  const isPrivacySaving = privacyMutation.isPending
  const isDownloadingDocument = documentDownloadMutation.isPending
  const downloadingDocumentId = documentDownloadMutation.variables

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
    return (
      checkWithPackage.package.display_name ?? checkWithPackage.package.slug ?? 'Background check'
    )
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
          <Stack gap={16}>
            <Row justify="space-between" align="center" wrap gap={12}>
              <Dialog.Title>Review background check</Dialog.Title>
              <Dialog.Close asChild>
                <Button size="sm" variant="outline" disabled={isSubmitting}>
                  Close
                </Button>
              </Dialog.Close>
            </Row>

            {!checkId ? (
              <Stack gap={12} align="center" justify="center" paddingVertical={24}>
                <Text color="$gray11">Select a background check to review the full details.</Text>
              </Stack>
            ) : detailQuery.isLoading || detailQuery.isFetching ? (
              <Stack gap={12} align="center" justify="center" paddingVertical={24}>
                <Spinner size="lg" />
                <Text color="$gray11">Loading background check…</Text>
              </Stack>
            ) : detailQuery.isError ? (
              <Stack
                gap={12}
                padding="md"
                backgroundColor="$color2"
                borderRadius={16}
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text color="$gray11">
                  We couldn't load this background check. Please try again.
                </Text>
                <Button size="sm" variant="outline" onPress={() => detailQuery.refetch()}>
                  <Row gap={8} align="center">
                    <RefreshCcw size="md" />
                    <Text>Retry</Text>
                  </Row>
                </Button>
              </Stack>
            ) : !detailedCheck ? (
              <Stack gap={12} align="center" justify="center" paddingVertical={24}>
                <Spinner size="lg" />
                <Text color="$gray11">Preparing detailed background check information…</Text>
              </Stack>
            ) : (
              <Stack gap={16}>
                <Stack
                  gap={12}
                  padding="sm"
                  backgroundColor="$color2"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Stack gap={4}>
                    <Text color="$gray11">{workerName}</Text>
                    {workerEmail ? <Text color="$gray11">{workerEmail}</Text> : null}
                    {organizationName ? (
                      <Text color="$gray11">Organization: {organizationName}</Text>
                    ) : null}
                  </Stack>
                  <Row gap={12} wrap>
                    <Text color="$gray11">
                      Package: <Text color="$gray11">{packageLabel}</Text>
                    </Text>
                    <Text color="$gray11">Created: {formatDateTime(detailedCheck.created_at)}</Text>
                    {(() => {
                      const checkWithCompletedAt = detailedCheck as typeof detailedCheck & {
                        completed_at?: string | null
                      }
                      const completedAt = checkWithCompletedAt.completed_at
                      if (!completedAt) return null
                      return <Text color="$gray11">Completed: {formatDateTime(completedAt)}</Text>
                    })()}
                    {detailedCheck.expires_at ? (
                      <Text color="$gray11">
                        Expires: {formatDateTime(detailedCheck.expires_at)}
                      </Text>
                    ) : null}
                  </Row>
                  {statusMeta && statusColors ? (
                    <Row
                      paddingHorizontal={12}
                      paddingVertical={4}
                      backgroundColor={statusColors.background}
                      borderWidth={1}
                      borderColor={statusColors.border}
                      borderRadius={12}
                      align="center"
                      gap={8}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <CheckCircle2 size="md" color={statusColors.text} />
                      <Text color={statusColors.text}>{statusMeta.label}</Text>
                    </Row>
                  ) : null}
                </Stack>

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

                <Stack gap={12}>
                  <Stack gap={4}>
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
                  </Stack>

                  <Stack gap={4}>
                    <Label htmlFor="admin-check-summary">Summary</Label>
                    <TextArea
                      id="admin-check-summary"
                      rows={4}
                      value={summary}
                      onChangeText={setSummary}
                      placeholder="Provide a concise summary of the findings and decision."
                    />
                  </Stack>

                  <Stack gap={4}>
                    <Label htmlFor="admin-check-notes">Internal notes</Label>
                    <TextArea
                      id="admin-check-notes"
                      rows={3}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Optional internal notes. These are stored with the status history."
                    />
                  </Stack>

                  <Stack gap={4}>
                    <Label htmlFor="admin-check-expires">Expiration (UTC)</Label>
                    <Input
                      id="admin-check-expires"
                      placeholder="YYYY-MM-DD"
                      value={expiresAt}
                      onChangeText={setExpiresAt}
                    />
                    <Text color="$gray11">Leave blank to clear expiration.</Text>
                  </Stack>
                </Stack>

                <Separator />

                <Stack gap={12}>
                  <Text color="$gray11">Provider summary</Text>
                  <TextArea
                    rows={6}
                    value={safeJson(detailedCheck.summary)}
                    editable={false}
                    backgroundColor="$color2"
                  />
                  <Text color="$gray11">Provider findings</Text>
                  <TextArea
                    rows={6}
                    value={safeJson(detailedCheck.findings)}
                    editable={false}
                    backgroundColor="$color2"
                  />
                </Stack>

                <Separator />

                <Stack gap={12}>
                  <Row justify="space-between" align="center">
                    <Text color="$gray11">Supporting documents</Text>
                    <Text color="$gray11">
                      {documents.length} {documents.length === 1 ? 'document' : 'documents'}
                    </Text>
                  </Row>

                  {documents.length === 0 ? (
                    <Text color="$gray11">No documents uploaded for this background check.</Text>
                  ) : (
                    <Stack gap={8}>
                      {documents.map((document) => {
                        const isDocumentLoading =
                          isDownloadingDocument && downloadingDocumentId === document.id
                        return (
                          <Row
                            key={document.id}
                            justify="space-between"
                            align="center"
                            padding="sm"
                            backgroundColor="$color2"
                            borderRadius={12}
                            borderWidth={1}
                            borderColor="$borderColor"
                            gap={12}
                          >
                            <Stack gap={4} flex={1}>
                              <Text color="$gray11">
                                {document.file_name ?? document.document_type ?? 'Document'}
                              </Text>
                              <Text color="$gray11">
                                Uploaded {formatDateTime(document.uploaded_at)}
                              </Text>
                            </Stack>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isDocumentLoading}
                              onPress={() => handleDownloadDocument(document.id)}
                            >
                              <Row gap={8} align="center">
                                {isDocumentLoading ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <DownloadCloud size="md" />
                                )}
                                <Text>{isDocumentLoading ? 'Preparing…' : 'View'}</Text>
                              </Row>
                            </Button>
                          </Row>
                        )
                      })}
                    </Stack>
                  )}
                </Stack>

                <Separator />

                <Stack gap={12}>
                  <Text color="$gray11">Privacy controls</Text>

                  <Stack
                    gap={12}
                    padding="sm"
                    backgroundColor="$color2"
                    borderRadius={16}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Row justify="space-between" align="center">
                      <Stack gap={4} flex={1} paddingRight={12}>
                        <Text color="$gray11">Show verified badge</Text>
                        <Text color="$gray11">
                          Allow organizations to see that this worker's background check is current.
                        </Text>
                      </Stack>
                      <Switch
                        size="sm"
                        checked={sharePublicly}
                        onChange={(value) =>
                          handlePrivacyUpdate(Boolean(value), sharedOrganizations)
                        }
                        disabled={isPrivacySaving}
                      >
                        <Switch.Thumb />
                      </Switch>
                    </Row>
                  </Stack>

                  <Stack gap={8}>
                    <Text color="$gray11">Shared with organizations</Text>
                    {sharedOrganizations.length === 0 ? (
                      <Stack
                        padding="sm"
                        backgroundColor="$color2"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor="$borderColor"
                      >
                        <Text color="$gray11">
                          No organizations currently have access to this background check.
                        </Text>
                      </Stack>
                    ) : (
                      <Stack gap={8}>
                        {sharedOrganizations.map((organizationId) => (
                          <Row
                            key={organizationId}
                            justify="space-between"
                            align="center"
                            padding="sm"
                            backgroundColor="$color2"
                            borderRadius={12}
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            <Text color="$gray11">{organizationId}</Text>
                            <Button
                              size="sm"
                              variant="outline"
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
                          </Row>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </Stack>

                {disputes.length > 0 ? (
                  <>
                    <Separator />
                    <Stack gap={8}>
                      <Text color="$gray11">Disputes</Text>
                      <Stack gap={8}>
                        {disputes.map((dispute) => (
                          <Stack
                            key={dispute.id}
                            gap={4}
                            padding="sm"
                            backgroundColor="$color2"
                            borderRadius={12}
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            <Text color="$gray11">{dispute.status}</Text>
                            <Text color="$gray11">
                              Submitted {formatDateTime(dispute.created_at)}
                            </Text>
                            {dispute.resolved_at ? (
                              <Text color="$gray11">
                                Resolved {formatDateTime(dispute.resolved_at)}
                              </Text>
                            ) : null}
                            {dispute.dispute_reason ? (
                              <Text color="$gray11">Reason: {dispute.dispute_reason}</Text>
                            ) : null}
                            {dispute.dispute_details ? (
                              <Text color="$gray11">Details: {dispute.dispute_details}</Text>
                            ) : null}
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </>
                ) : null}

                {statusHistory.length > 0 ? (
                  <>
                    <Separator />
                    <Stack gap={8}>
                      <Text color="$gray11">Status history</Text>
                      <Stack gap={8} overflow="scroll" style={{ maxHeight: 200 }}>
                        {statusHistory
                          .slice()
                          .reverse()
                          .map((entry, index) => {
                            const meta = entry?.status
                              ? getStatusMetadata(entry.status as BackgroundCheckStatus)
                              : null
                            return (
                              <Stack
                                key={`${entry?.occurred_at ?? index}`}
                                borderWidth={1}
                                borderColor="$borderColor"
                                borderRadius={16}
                                padding="sm"
                                gap={4}
                                backgroundColor="$color2"
                              >
                                <Text color="$gray11">
                                  {meta?.label ?? entry?.status ?? 'Status update'}
                                </Text>
                                <Text color="$gray11">
                                  {entry?.occurred_at
                                    ? new Date(entry.occurred_at).toLocaleString()
                                    : '—'}
                                </Text>
                                {entry?.notes ? (
                                  <Text color="$gray11">Notes: {entry.notes}</Text>
                                ) : null}
                              </Stack>
                            )
                          })}
                      </Stack>
                    </Stack>
                  </>
                ) : null}
              </Stack>
            )}

            <Separator />

            <Row gap={8} justify="flex-end">
              <Dialog.Close asChild>
                <Button size="sm" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button size="sm" onPress={handleSubmit} disabled={!detailedCheck || isSubmitting}>
                {isSubmitting ? (
                  <Row gap={8} align="center">
                    <Spinner size="sm" color="$gray11" />
                    <Text color="$gray11">Saving…</Text>
                  </Row>
                ) : (
                  'Save changes'
                )}
              </Button>
            </Row>
          </Stack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
