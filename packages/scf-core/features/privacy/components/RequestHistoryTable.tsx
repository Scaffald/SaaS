/**
 * Request History Table Component
 * REQ-3: CCPA Compliance Implementation
 *
 * Displays a table of the user's CCPA request history
 * with status, dates, and download links
 */

import { Text, XStack, YStack, Button } from '@unicornlove/ui'

/**
 * Request status type
 */
export type RequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * Request type
 */
export type RequestType =
  | 'export'
  | 'deletion'
  | 'correction'
  | 'opt_out'
  | 'opt_in'

/**
 * Privacy request structure
 */
export interface PrivacyRequest {
  id: string
  type: RequestType
  status: RequestStatus
  created_at: string
  completed_at?: string
  expires_at?: string
  download_url?: string
  notes?: string
}

/**
 * Props for RequestHistoryTable
 */
interface RequestHistoryTableProps {
  requests: PrivacyRequest[]
  onDownload?: (requestId: string) => void
  onCancel?: (requestId: string) => void
}

/**
 * Status badge colors
 */
const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string }> = {
  pending: { bg: '$yellow3', text: '$yellow11' },
  processing: { bg: '$blue3', text: '$blue11' },
  completed: { bg: '$green3', text: '$green11' },
  failed: { bg: '$red3', text: '$red11' },
  cancelled: { bg: '$color4', text: '$color11' },
}

/**
 * Request type labels
 */
const TYPE_LABELS: Record<RequestType, string> = {
  export: 'Data Export',
  deletion: 'Data Deletion',
  correction: 'Data Correction',
  opt_out: 'Opt-Out',
  opt_in: 'Opt-In',
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: RequestStatus }) {
  const colors = STATUS_COLORS[status]
  return (
    <XStack
      backgroundColor={colors.bg}
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
    >
      <Text fontSize="$2" color={colors.text} fontWeight="500" textTransform="capitalize">
        {status}
      </Text>
    </XStack>
  )
}

/**
 * Single request row
 */
function RequestRow({
  request,
  onDownload,
  onCancel,
}: {
  request: PrivacyRequest
  onDownload?: (requestId: string) => void
  onCancel?: (requestId: string) => void
}) {
  const canDownload = request.status === 'completed' && request.type === 'export' && request.download_url
  const canCancel = request.status === 'pending'

  return (
    <XStack
      padding="$3"
      backgroundColor="$color2"
      borderRadius="$2"
      borderWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$4"
      flexWrap="wrap"
    >
      {/* Type */}
      <YStack flex={1} minWidth={120}>
        <Text fontSize="$2" color="$color10">
          Type
        </Text>
        <Text fontSize="$3" fontWeight="500">
          {TYPE_LABELS[request.type]}
        </Text>
      </YStack>

      {/* Status */}
      <YStack minWidth={100}>
        <Text fontSize="$2" color="$color10">
          Status
        </Text>
        <StatusBadge status={request.status} />
      </YStack>

      {/* Submitted Date */}
      <YStack flex={1} minWidth={140}>
        <Text fontSize="$2" color="$color10">
          Submitted
        </Text>
        <Text fontSize="$3">
          {formatDate(request.created_at)}
        </Text>
      </YStack>

      {/* Completed Date */}
      <YStack flex={1} minWidth={140}>
        <Text fontSize="$2" color="$color10">
          Completed
        </Text>
        <Text fontSize="$3">
          {request.completed_at ? formatDate(request.completed_at) : '—'}
        </Text>
      </YStack>

      {/* Actions */}
      <XStack gap="$2" minWidth={120} justifyContent="flex-end">
        {canDownload && (
          <Button
            size="$2"
            onPress={() => onDownload?.(request.id)}
          >
            Download
          </Button>
        )}
        {canCancel && (
          <Button
            size="$2"
            variant="outlined"
            onPress={() => onCancel?.(request.id)}
          >
            Cancel
          </Button>
        )}
      </XStack>
    </XStack>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <YStack
      padding="$6"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      alignItems="center"
      gap="$2"
    >
      <Text fontSize="$4" color="$color11">
        No privacy requests yet
      </Text>
      <Text fontSize="$3" color="$color10" textAlign="center">
        When you submit a data export, deletion, or other privacy request,
        it will appear here so you can track its status.
      </Text>
    </YStack>
  )
}

/**
 * Request History Table Component
 *
 * Displays the user's privacy request history with status and actions
 */
export function RequestHistoryTable({
  requests,
  onDownload,
  onCancel,
}: RequestHistoryTableProps) {
  if (!requests || requests.length === 0) {
    return <EmptyState />
  }

  return (
    <YStack gap="$2">
      {/* Header row - hidden on mobile */}
      <XStack
        padding="$3"
        display="none"
        $gtMd={{ display: 'flex' }}
        gap="$4"
      >
        <Text flex={1} fontSize="$2" color="$color10" fontWeight="600" minWidth={120}>
          Type
        </Text>
        <Text fontSize="$2" color="$color10" fontWeight="600" minWidth={100}>
          Status
        </Text>
        <Text flex={1} fontSize="$2" color="$color10" fontWeight="600" minWidth={140}>
          Submitted
        </Text>
        <Text flex={1} fontSize="$2" color="$color10" fontWeight="600" minWidth={140}>
          Completed
        </Text>
        <Text fontSize="$2" color="$color10" fontWeight="600" minWidth={120} textAlign="right">
          Actions
        </Text>
      </XStack>

      {/* Request rows */}
      {requests.map((request) => (
        <RequestRow
          key={request.id}
          request={request}
          onDownload={onDownload}
          onCancel={onCancel}
        />
      ))}

      {/* Info text */}
      <Text fontSize="$2" color="$color10" marginTop="$2">
        Data export requests are processed within 45 days as required by CCPA.
        Completed exports are available for download for 30 days.
      </Text>
    </YStack>
  )
}

export default RequestHistoryTable
