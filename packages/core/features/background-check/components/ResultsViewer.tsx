import { memo } from 'react'
import { Alert } from 'react-native'
import { AlertTriangle, DownloadCloud, X as CloseIcon } from '@tamagui/lucide-icons'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

import { api } from '@app/core/utils/api'
import { formatDate } from '@app/core/features/profile/utils/date-formatting'

import {
  getStatusMetadata,
  getStatusToneColors,
  type BackgroundCheckDocument,
  type BackgroundCheckSummary,
} from './status.utils'
import { CheckProgressTracker } from './CheckProgressTracker'
import { PrivacyControls } from './PrivacyControls'
import { DisputeStatusTracker } from './DisputeStatusTracker'
import { useDispute } from '../hooks/useDispute'

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
    },
  )

  const {
    disputes,
    isLoadingDisputes,
    hasActiveDispute,
    refetchDisputes,
  } = useDispute({
    checkId: checkId ?? null,
    enabled: Boolean(checkId),
  })

  if (!checkId) {
    return null
  }

  if (getCheckQuery.isLoading || getCheckQuery.isFetching) {
    return (
      <YStack gap="$3" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <XStack gap="$2" items="center">
          <Spinner size="small" color="$color11" />
          <Text fontSize="$3" color="$color11">
            Loading background check details…
          </Text>
        </XStack>
      </YStack>
    )
  }

  if (getCheckQuery.isError || !getCheckQuery.data?.check) {
    return (
      <YStack gap="$3" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <XStack gap="$2" items="center">
          <AlertTriangle size={18} color="$red10" />
          <Text fontSize="$3" color="$red11">
            We couldn’t load your background check details. Try again.
          </Text>
        </XStack>
        <Button size="$3" variant="outlined" onPress={() => getCheckQuery.refetch()}>
          Retry
        </Button>
      </YStack>
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
    <YStack gap="$4" p="$4" bg="$background" rounded="$4" borderWidth={1} borderColor="$borderColor">
      <XStack justify="space-between" items="center">
        <YStack gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            {summary?.package?.display_name ?? 'Background check results'}
          </Text>
          <XStack gap="$2" items="center">
            <YStack
              px="$3"
              py="$1"
              bg={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              rounded="$3"
            >
              <Text fontSize="$2" fontWeight="600" color={statusColors.text}>
                {statusMeta.label}
              </Text>
            </YStack>
            <Text fontSize="$2" color="$color10">
              Last updated {formatDate(detail.updated_at)}
            </Text>
          </XStack>
        </YStack>
        <Button size="$3" variant="outlined" icon={CloseIcon} onPress={onClose}>
          Close
        </Button>
      </XStack>

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
        <YStack
          gap="$2"
          p="$3"
          bg="$color2"
          rounded="$4"
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
        </YStack>
      )}

      {detail.summary && (
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Summary
          </Text>
          <Text fontSize="$2" color="$color10">
            {detail.summary}
          </Text>
        </YStack>
      )}

      {detail.findings && (
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color12">
            Findings
          </Text>
          <Text fontSize="$2" color="$color10">
            {JSON.stringify(detail.findings, null, 2)}
          </Text>
        </YStack>
      )}

      <YStack gap="$3">
        <XStack justify="space-between" items="center">
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
                'Downloadable reports will be available once signed report URLs are enabled.',
              )
            }
            disabled={documents.length === 0}
          >
            Download report
          </Button>
        </XStack>
        {documents.length === 0 ? (
          <Text fontSize="$2" color="$color10">
            No documents uploaded yet.
          </Text>
        ) : (
          <YStack gap="$2">
            {documents.map((document: BackgroundCheckDocument) => (
              <XStack
                key={document.id}
                justify="space-between"
                items="center"
                p="$3"
                bg="$color2"
                rounded="$3"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <YStack gap="$1">
                  <Text fontSize="$3" color="$color12">
                    {document.file_name}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    Uploaded {formatDate(document.uploaded_at)}
                  </Text>
                </YStack>
                <Button size="$2" variant="outlined" disabled>
                  View
                </Button>
              </XStack>
            ))}
          </YStack>
        )}
      </YStack>

      <Separator />

      <PrivacyControls checkId={checkId} metadata={detail.metadata} />
    </YStack>
  )
})

