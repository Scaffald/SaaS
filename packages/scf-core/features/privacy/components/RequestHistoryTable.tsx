/**
 * Request History Table Component
 * CCPA Compliance Implementation
 *
 * Displays a table of the user's CCPA request history
 * with status, dates, and download links
 */

import { Text, Row, Stack, Button } from '@unicornlove/beyond-ui'

/**
 * Request status type
 */
export type RequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Request type
 */
export type RequestType = 'export' | 'deletion' | 'correction' | 'opt_out' | 'opt_in'

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
    <Row backgroundColor={colors.bg} paddingHorizontal={8} paddingVertical={4} borderRadius={8}>
      <Text color={colors.text} textTransform="capitalize">
        {status}
      </Text>
    </Row>
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
  const canDownload =
    request.status === 'completed' && request.type === 'export' && request.download_url
  const canCancel = request.status === 'pending'

  return (
    <Row
      padding={12}
      backgroundColor="$color2"
      borderRadius={8}
      borderWidth={1}
      borderColor="$borderColor"
      align="center"
      gap={16}
      flexWrap="wrap"
    >
      {/* Type */}
      <Stack flex={1} minWidth={120}>
        <Text color="gray">Type</Text>
        <Text>{TYPE_LABELS[request.type]}</Text>
      </Stack>

      {/* Status */}
      <Stack minWidth={100}>
        <Text color="gray">Status</Text>
        <StatusBadge status={request.status} />
      </Stack>

      {/* Submitted Date */}
      <Stack flex={1} minWidth={140}>
        <Text color="gray">Submitted</Text>
        <Text>{formatDate(request.created_at)}</Text>
      </Stack>

      {/* Completed Date */}
      <Stack flex={1} minWidth={140}>
        <Text color="gray">Completed</Text>
        <Text>{request.completed_at ? formatDate(request.completed_at) : '—'}</Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} minWidth={120} justify="flex-end">
        {canDownload && (
          <Button size={8} onPress={() => onDownload?.(request.id)}>
            Download
          </Button>
        )}
        {canCancel && (
          <Button size={8} variant="outline" onPress={() => onCancel?.(request.id)}>
            Cancel
          </Button>
        )}
      </Row>
    </Row>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <Stack
      padding={24}
      backgroundColor="$color2"
      borderRadius={12}
      borderWidth={1}
      borderColor="$borderColor"
      align="center"
      gap={8}
    >
      <Text color="gray">No privacy requests yet</Text>
      <Text color="gray" textAlign="center">
        When you submit a data export, deletion, or other privacy request, it will appear here so
        you can track its status.
      </Text>
    </Stack>
  )
}

/**
 * Request History Table Component
 *
 * Displays the user's privacy request history with status and actions
 */
export function RequestHistoryTable({ requests, onDownload, onCancel }: RequestHistoryTableProps) {
  if (!requests || requests.length === 0) {
    return <EmptyState />
  }

  return (
    <Stack gap={8}>
      {/* Header row - hidden on mobile */}
      <Row padding={12} display="none" $gtMd={{ display: 'flex' }} gap={16}>
        <Text flex={1} color="gray" minWidth={120}>
          Type
        </Text>
        <Text color="gray" minWidth={100}>
          Status
        </Text>
        <Text flex={1} color="gray" minWidth={140}>
          Submitted
        </Text>
        <Text flex={1} color="gray" minWidth={140}>
          Completed
        </Text>
        <Text color="gray" minWidth={120} textAlign="right">
          Actions
        </Text>
      </Row>

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
      <Text color="gray" marginTop={8}>
        Data export requests are processed within 45 days as required by CCPA. Completed exports are
        available for download for 30 days.
      </Text>
    </Stack>
  )
}

export default RequestHistoryTable
