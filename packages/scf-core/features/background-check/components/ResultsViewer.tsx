import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { useBackgroundCheck } from '@scf/core/utils/background-checks-sdk-hooks'
import { AlertTriangle, X as CloseIcon, DownloadCloud } from 'lucide-react-native'
import { memo } from 'react'
import { Alert } from 'react-native'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useDispute } from '../hooks/useDispute'
import { CheckProgressTracker } from './CheckProgressTracker'
import { DisputeStatusTracker } from './DisputeStatusTracker'
import { PrivacyControls } from './PrivacyControls'
import {
  type BackgroundCheckDocument,
  type BackgroundCheckSummary,
  getStatusMetadata,
  getStatusToneColors,
} from './status.utils'

interface ResultsViewerProps {
  checkId: string | null
  summary?: BackgroundCheckSummary
  onClose: () => void
  onRequestDispute?: (checkId: string) => void
}

export const ResultsViewer = memo(function ResultsViewer({
  checkId,
  summary,
  onClose,
  onRequestDispute,
}: ResultsViewerProps) {
  const getCheckQuery = useBackgroundCheck(checkId || undefined, {
    enabled: Boolean(checkId),
  })

  const { disputes, isLoadingDisputes, hasActiveDispute, refetchDisputes } = useDispute({
    checkId: checkId ?? null,
    enabled: Boolean(checkId),
  })

  if (!checkId) {
    return null
  }

  if (getCheckQuery.isLoading || getCheckQuery.isFetching) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor="$background"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row gap={8} align="center">
          <Spinner size="sm" color="$gray11" />
          <Text color="$gray11">Loading background check details…</Text>
        </Row>
      </Stack>
    )
  }

  if (getCheckQuery.isError || !getCheckQuery.data?.check) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor="$background"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row gap={8} align="center">
          <AlertTriangle size={18} color="$red10" />
          <Text color="$red11">We couldn’t load your background check details. Try again.</Text>
        </Row>
        <Button size="sm" variant="outline" onPress={() => getCheckQuery.refetch()}>
          Retry
        </Button>
      </Stack>
    )
  }

  const detail = getCheckQuery.data.check
  const documents = getCheckQuery.data.documents ?? []
  const statusMeta = getStatusMetadata(detail.status)
  const statusColors = getStatusToneColors(statusMeta.tone)

  let completedAtFromHistory: string | null = null
  if (Array.isArray(detail.status_history)) {
    for (const entry of detail.status_history as unknown[]) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as Record<string, unknown>
      const statusValue = typeof record.status === 'string' ? record.status : null
      if (!statusValue || !statusValue.startsWith('completed')) continue
      const occurredAt =
        typeof record.occurred_at === 'string' ? (record.occurred_at as string) : null
      if (occurredAt) {
        completedAtFromHistory = occurredAt
      }
    }
  }

  return (
    <Stack
      gap={16}
      padding="md"
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Row justify="space-between" align="center">
        <Stack gap={4}>
          <Text color="$gray11">{summary?.package?.display_name ?? 'Background check results'}</Text>
          <Row gap={8} align="center">
            <Stack
              paddingHorizontal={12}
              paddingVertical={4}
              backgroundColor={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              borderRadius={12}
            >
              <Text color={statusColors.text}>{statusMeta.label}</Text>
            </Stack>
            <Text color="$gray11">Last updated {formatDate(detail.updated_at)}</Text>
          </Row>
        </Stack>
        <Button size="sm" variant="outline" icon={CloseIcon} onPress={onClose}>
          Close
        </Button>
      </Row>

      <CheckProgressTracker
        status={detail.status}
        createdAt={detail.created_at}
        componentStatuses={detail.component_statuses}
        statusHistory={detail.status_history}
        estimatedCompletionDate={detail.estimated_completion_date}
        completedAt={completedAtFromHistory}
        expiresAt={detail.expires_at ?? null}
      />

      <DisputeStatusTracker
        disputes={disputes}
        isLoading={isLoadingDisputes}
        onRefresh={refetchDisputes}
      />

      {onRequestDispute && summary?.status && (
        <Stack
          gap={8}
          padding="sm"
          backgroundColor="$color2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text color="$gray11">Notice something inaccurate?</Text>
          <Text color="$gray11">
            Submit a dispute so our compliance team can review and correct any issues.
          </Text>
          <Button
            size="sm"
            color="primary"
            disabled={hasActiveDispute}
            onPress={() => {
              if (checkId) {
                onRequestDispute(checkId)
              }
            }}
          >
            {hasActiveDispute ? 'Dispute in progress' : 'Dispute results'}
          </Button>
        </Stack>
      )}

      {detail.summary && (
        <Stack gap={8}>
          <Text color="$gray11">Summary</Text>
          <Text color="$gray11">{detail.summary}</Text>
        </Stack>
      )}

      {detail.findings && (
        <Stack gap={8}>
          <Text color="$gray11">Findings</Text>
          <Text color="$gray11">{JSON.stringify(detail.findings, null, 2)}</Text>
        </Stack>
      )}

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text color="$gray11">Documents</Text>
          <Button
            size="sm"
            variant="outline"
            icon={DownloadCloud}
            onPress={() =>
              Alert.alert(
                'Download coming soon',
                'Downloadable reports will be available once signed report URLs are enabled.'
              )
            }
            disabled={documents.length === 0}
          >
            Download report
          </Button>
        </Row>
        {documents.length === 0 ? (
          <Text color="$gray11">No documents uploaded yet.</Text>
        ) : (
          <Stack gap={8}>
            {documents.map((document: BackgroundCheckDocument) => (
              <Row
                key={document.id}
                justify="space-between"
                align="center"
                padding="sm"
                backgroundColor="$color2"
                borderRadius={12}
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Stack gap={4}>
                  <Text color="$gray11">{document.file_name}</Text>
                  <Text color="$gray11">Uploaded {formatDate(document.uploaded_at)}</Text>
                </Stack>
                <Button size="xs" variant="outline" disabled>
                  View
                </Button>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>

      <Separator />

      <PrivacyControls checkId={checkId} metadata={detail.metadata} />
    </Stack>
  )
})
