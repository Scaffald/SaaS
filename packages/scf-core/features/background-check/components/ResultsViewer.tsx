import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { api } from '@scf/core/utils/api'
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
  const getCheckQuery = api.backgroundChecks.getCheck.useQuery(
    { background_check_id: checkId ?? '' },
    {
      enabled: Boolean(checkId),
      refetchOnMount: false,
      refetchOnWindowFocus: true,
    }
  )

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
        gap="$3"
        padding="$4"
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row gap="$2" alignItems="center">
          <Spinner size="small" color="$color11" />
          <Text fontSize="$3" color="$color11">
            Loading background check details…
          </Text>
        </Row>
      </Stack>
    )
  }

  if (getCheckQuery.isError || !getCheckQuery.data?.check) {
    return (
      <Stack
        gap="$3"
        padding="$4"
        backgroundColor="$background"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Row gap="$2" alignItems="center">
          <AlertTriangle size={18} color="$red10" />
          <Text fontSize="$3" color="$red11">
            We couldn’t load your background check details. Try again.
          </Text>
        </Row>
        <Button size="$3" variant="outlined" onPress={() => getCheckQuery.refetch()}>
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
      gap="$4"
      padding="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Row justifyContent="space-between" alignItems="center">
        <Stack gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            {summary?.package?.display_name ?? 'Background check results'}
          </Text>
          <Row gap="$2" alignItems="center">
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1"
              backgroundColor={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              borderRadius="$3"
            >
              <Text fontSize="$2" fontWeight="600" color={statusColors.text}>
                {statusMeta.label}
              </Text>
            </Stack>
            <Text fontSize="$2" color="$color10">
              Last updated {formatDate(detail.updated_at)}
            </Text>
          </Row>
        </Stack>
        <Button size="$3" variant="outlined" icon={CloseIcon} onPress={onClose}>
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
          gap="$2"
          padding="$3"
          backgroundColor="$color2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Notice something inaccurate?
          </Text>
          <Text fontSize="$2" color="$color10">
            Submit a dispute so our compliance team can review and correct any issues.
          </Text>
          <Button
            size="$3"
            theme="blue"
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
        <Stack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Summary
          </Text>
          <Text fontSize="$2" color="$color10">
            {detail.summary}
          </Text>
        </Stack>
      )}

      {detail.findings && (
        <Stack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Findings
          </Text>
          <Text fontSize="$2" color="$color10">
            {JSON.stringify(detail.findings, null, 2)}
          </Text>
        </Stack>
      )}

      <Stack gap="$3">
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Documents
          </Text>
          <Button
            size="$3"
            variant="outlined"
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
          <Text fontSize="$2" color="$color10">
            No documents uploaded yet.
          </Text>
        ) : (
          <Stack gap="$2">
            {documents.map((document: BackgroundCheckDocument) => (
              <Row
                key={document.id}
                justifyContent="space-between"
                alignItems="center"
                padding="$3"
                backgroundColor="$color2"
                borderRadius="$3"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Stack gap="$1">
                  <Text fontSize="$3" color="$color12">
                    {document.file_name}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    Uploaded {formatDate(document.uploaded_at)}
                  </Text>
                </Stack>
                <Button size="$2" variant="outlined" disabled>
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
