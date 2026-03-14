/**
 * Request History Table Component
 * CCPA Compliance Implementation
 *
 * Displays a table of the user's CCPA request history
 * with status, dates, and download links
 */

import { Text, Row, Stack, Button, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

/**
 * Request status type
 */
export type RequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Request type
 */
export type RequestType =
  | "export"
  | "deletion"
  | "correction"
  | "opt_out"
  | "opt_in";

/**
 * Privacy request structure
 */
export interface PrivacyRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
  download_url?: string;
  notes?: string;
}

/**
 * Props for RequestHistoryTable
 */
interface RequestHistoryTableProps {
  requests: PrivacyRequest[];
  onDownload?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

/**
 * Status badge colors (theme-aware)
 */
function getStatusColors(
  t: "light" | "dark"
): Record<RequestStatus, { bg: string; text: string }> {
  return {
    pending: {
      bg: t === "dark" ? colors.yellow[900] : colors.yellow[100],
      text: t === "dark" ? colors.yellow[300] : colors.yellow[700],
    },
    processing: {
      bg: t === "dark" ? colors.blue[900] : colors.blue[100],
      text: t === "dark" ? colors.blue[300] : colors.blue[700],
    },
    completed: {
      bg: t === "dark" ? colors.green[900] : colors.green[100],
      text: t === "dark" ? colors.green[300] : colors.green[700],
    },
    failed: {
      bg: t === "dark" ? colors.red[900] : colors.red[100],
      text: t === "dark" ? colors.red[300] : colors.red[500],
    },
    cancelled: {
      bg: t === "dark" ? colors.gray[800] : colors.gray[100],
      text: t === "dark" ? colors.gray[300] : colors.gray[600],
    },
  };
}

/**
 * Request type labels
 */
const TYPE_LABELS: Record<RequestType, string> = {
  export: "Data Export",
  deletion: "Data Deletion",
  correction: "Data Correction",
  opt_out: "Opt-Out",
  opt_in: "Opt-In",
};

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: RequestStatus }) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  const statusColors = getStatusColors(t)[status];
  return (
    <Row
      backgroundColor={statusColors.bg}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={8}
    >
      <Text style={{ color: statusColors.text, textTransform: "capitalize" }}>
        {status}
      </Text>
    </Row>
  );
}

/**
 * Single request row
 */
function RequestRow({
  request,
  onDownload,
  onCancel,
}: {
  request: PrivacyRequest;
  onDownload?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  const canDownload =
    request.status === "completed" &&
    request.type === "export" &&
    request.download_url;
  const canCancel = request.status === "pending";

  return (
    <Row
      padding="sm"
      backgroundColor={colors.bg[t].default}
      borderRadius={8}
      borderWidth={1}
      borderColor={colors.border[t].default}
      align="center"
      gap={16}
      wrap
    >
      {/* Type */}
      <Stack flex={1} minWidth={120}>
        <Text style={{ color: colors.text[t].secondary }}>Type</Text>
        <Text>{TYPE_LABELS[request.type]}</Text>
      </Stack>

      {/* Status */}
      <Stack minWidth={100}>
        <Text style={{ color: colors.text[t].secondary }}>Status</Text>
        <StatusBadge status={request.status} />
      </Stack>

      {/* Submitted Date */}
      <Stack flex={1} minWidth={140}>
        <Text style={{ color: colors.text[t].secondary }}>Submitted</Text>
        <Text>{formatDate(request.created_at)}</Text>
      </Stack>

      {/* Completed Date */}
      <Stack flex={1} minWidth={140}>
        <Text style={{ color: colors.text[t].secondary }}>Completed</Text>
        <Text>
          {request.completed_at ? formatDate(request.completed_at) : "\u2014"}
        </Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} minWidth={120} justify="flex-end">
        {canDownload && (
          <Button size="sm" onPress={() => onDownload?.(request.id)}>
            Download
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onPress={() => onCancel?.(request.id)}
          >
            Cancel
          </Button>
        )}
      </Row>
    </Row>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";
  return (
    <Stack
      padding="xl"
      backgroundColor={colors.bg[t].default}
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[t].default}
      align="center"
      gap={8}
    >
      <Text style={{ color: colors.text[t].secondary }}>
        No privacy requests yet
      </Text>
      <Text style={{ color: colors.text[t].secondary, textAlign: "center" }}>
        When you submit a data export, deletion, or other privacy request, it
        will appear here so you can track its status.
      </Text>
    </Stack>
  );
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
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  if (!requests || requests.length === 0) {
    return <EmptyState />;
  }

  return (
    <Stack gap={8}>
      {/* Header row */}
      <Row padding="sm" gap={16}>
        <Text style={{ flex: 1, color: colors.text[t].secondary, minWidth: 120 }}>
          Type
        </Text>
        <Text style={{ color: colors.text[t].secondary, minWidth: 100 }}>
          Status
        </Text>
        <Text style={{ flex: 1, color: colors.text[t].secondary, minWidth: 140 }}>
          Submitted
        </Text>
        <Text style={{ flex: 1, color: colors.text[t].secondary, minWidth: 140 }}>
          Completed
        </Text>
        <Text
          style={{
            color: colors.text[t].secondary,
            minWidth: 120,
            textAlign: "right",
          }}
        >
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
      <Text style={{ color: colors.text[t].tertiary, marginTop: 8 }}>
        Data export requests are processed within 45 days as required by CCPA.
        Completed exports are available for download for 30 days.
      </Text>
    </Stack>
  );
}

export default RequestHistoryTable;
