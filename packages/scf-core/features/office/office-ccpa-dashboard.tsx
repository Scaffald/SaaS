/**
 * CCPA Admin Dashboard
 *
 * Admin dashboard for compliance team to:
 * - View and manage CCPA requests across all users
 * - Monitor compliance metrics
 * - Track request processing times
 * - Handle breach notifications
 * - Generate compliance reports
 */

import { useState } from "react";
import {
  Button,
  ScrollView,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import {
  useCCPAComplianceMetrics,
  useCCPAAdminRequests,
  useCCPAProcessRequestMutation,
} from "@scf/core/utils/ccpa-sdk-hooks";
import { colors } from "@scaffald/ui/tokens";

/**
 * Request status type for admin view
 */
type AdminRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "appealed";

/**
 * CCPA request type for admin view
 */
interface AdminCCPARequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  type: "export" | "deletion" | "correction" | "opt_out" | "opt_in";
  status: AdminRequestStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  assigned_to?: string;
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
  days_elapsed: number;
  is_overdue: boolean;
}

/**
 * Status badge colors
 */
const getStatusColors = (
  theme: "light" | "dark"
): Record<AdminRequestStatus, { bg: string; text: string }> => ({
  pending: {
    bg: theme === "light" ? colors.yellow[50] : colors.yellow[900],
    text: theme === "light" ? colors.yellow[700] : colors.yellow[300],
  },
  processing: {
    bg: theme === "light" ? colors.blue[50] : colors.blue[900],
    text: theme === "light" ? colors.blue[700] : colors.blue[300],
  },
  completed: {
    bg: theme === "light" ? colors.green[50] : colors.green[900],
    text: theme === "light" ? colors.green[700] : colors.green[300],
  },
  failed: {
    bg: theme === "light" ? colors.error[50] : colors.error[900],
    text: theme === "light" ? colors.error[700] : colors.error[300],
  },
  cancelled: { bg: "$color4", text: colors.text[theme].secondary },
  appealed: {
    bg: theme === "light" ? colors.yellow[50] : colors.yellow[900],
    text: theme === "light" ? colors.yellow[700] : colors.yellow[300],
  },
});

/**
 * Priority badge colors
 */
const getPriorityColors = (
  theme: "light" | "dark"
): Record<string, { bg: string; text: string }> => ({
  low: { bg: "$color4", text: colors.text[theme].secondary },
  medium: {
    bg: theme === "light" ? colors.yellow[50] : colors.yellow[900],
    text: theme === "light" ? colors.yellow[700] : colors.yellow[300],
  },
  high: {
    bg: theme === "light" ? colors.yellow[50] : colors.yellow[900],
    text: theme === "light" ? colors.yellow[700] : colors.yellow[300],
  },
  urgent: {
    bg: theme === "light" ? colors.error[50] : colors.error[900],
    text: theme === "light" ? colors.error[700] : colors.error[300],
  },
});

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
function StatusBadge({ status }: { status: AdminRequestStatus }) {
  const { theme } = useThemeContext();
  const statusColors = getStatusColors(theme)[status];
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
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: string }) {
  const { theme } = useThemeContext();
  const priorityColors = getPriorityColors(theme);
  const selectedColors = priorityColors[priority] || priorityColors.low;
  return (
    <Row
      backgroundColor={selectedColors.bg}
      paddingHorizontal={8}
      paddingVertical={4}
      borderRadius={8}
    >
      <Text style={{ color: selectedColors.text, textTransform: "capitalize" }}>
        {priority}
      </Text>
    </Row>
  );
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: string;
}) {
  const { theme } = useThemeContext();
  const defaultColor = color || colors.text[theme].primary;
  const trendColor =
    trend === "up"
      ? theme === "light"
        ? colors.green[700]
        : colors.green[300]
      : trend === "down"
      ? theme === "light"
        ? colors.error[700]
        : colors.error[300]
      : colors.text[theme].secondary;

  return (
    <Stack
      padding="md"
      style={{ backgroundColor: colors.bg[theme].subtle }}
      borderRadius={12}
      borderWidth={1}
      borderColor={colors.border[theme].default}
      flex={1}
      minWidth={150}
      gap={4}
    >
      <Text style={{ color: colors.text[theme].secondary }}>{label}</Text>
      <Text style={{ color: defaultColor }}>{value}</Text>
      {trend && (
        <Text style={{ color: trendColor }}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} vs last month
        </Text>
      )}
    </Stack>
  );
}

/**
 * Request row component for admin table
 */
function RequestRow({
  request,
  onAssign,
  onProcess,
  onView,
}: {
  request: AdminCCPARequest;
  onAssign?: (id: string) => void;
  onProcess?: (id: string) => void;
  onView?: (id: string) => void;
}) {
  const { theme } = useThemeContext();
  return (
    <Row
      padding="sm"
      style={{
        backgroundColor: request.is_overdue
          ? theme === "light"
            ? colors.error[50]
            : colors.error[900]
          : colors.bg[theme].subtle,
      }}
      borderRadius={8}
      borderWidth={1}
      borderColor={
        request.is_overdue
          ? theme === "light"
            ? colors.error[300]
            : colors.error[700]
          : colors.border[theme].default
      }
      align="center"
      gap={12}
      wrap
    >
      {/* Request ID */}
      <Stack minWidth={100}>
        <Text style={{ color: colors.text[theme].secondary }}>Request ID</Text>
        <Text>{request.id.slice(0, 8)}...</Text>
      </Stack>

      {/* User */}
      <Stack flex={1} minWidth={140}>
        <Text style={{ color: colors.text[theme].secondary }}>User</Text>
        <Text>{request.user_name}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          {request.user_email}
        </Text>
      </Stack>

      {/* Type */}
      <Stack minWidth={100}>
        <Text style={{ color: colors.text[theme].secondary }}>Type</Text>
        <Text style={{ textTransform: "capitalize" }}>
          {request.type.replace("_", " ")}
        </Text>
      </Stack>

      {/* Status */}
      <Stack minWidth={100}>
        <Text style={{ color: colors.text[theme].secondary }}>Status</Text>
        <StatusBadge status={request.status} />
      </Stack>

      {/* Priority */}
      <Stack minWidth={80}>
        <Text style={{ color: colors.text[theme].secondary }}>Priority</Text>
        <PriorityBadge priority={request.priority} />
      </Stack>

      {/* Days Elapsed */}
      <Stack minWidth={80}>
        <Text style={{ color: colors.text[theme].secondary }}>Days</Text>
        <Text
          color={
            request.is_overdue
              ? theme === "light"
                ? colors.error[700]
                : colors.error[300]
              : request.days_elapsed > 30
              ? theme === "light"
                ? colors.yellow[700]
                : colors.yellow[300]
              : colors.text[theme].primary
          }
        >
          {request.days_elapsed}
          {request.is_overdue && " (OVERDUE)"}
        </Text>
      </Stack>

      {/* Submitted */}
      <Stack flex={1} minWidth={120}>
        <Text style={{ color: colors.text[theme].secondary }}>Submitted</Text>
        <Text>{formatDate(request.created_at)}</Text>
      </Stack>

      {/* Actions */}
      <Row gap={8} minWidth={200} justify="flex-end">
        <Button
          size="sm"
          variant="outline"
          onPress={() => onView?.(request.id)}
        >
          View
        </Button>
        {request.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onPress={() => onAssign?.(request.id)}
          >
            Assign
          </Button>
        )}
        {(request.status === "pending" || request.status === "processing") && (
          <Button size="sm" onPress={() => onProcess?.(request.id)}>
            Process
          </Button>
        )}
      </Row>
    </Row>
  );
}

/**
 * Filter bar component
 */
function FilterBar({
  statusFilter,
  typeFilter,
  priorityFilter,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
}: {
  statusFilter: string;
  typeFilter: string;
  priorityFilter: string;
  onStatusChange: (status: string) => void;
  onTypeChange: (type: string) => void;
  onPriorityChange: (priority: string) => void;
}) {
  const { theme } = useThemeContext();
  return (
    <Row gap={12} wrap align="center">
      <Stack gap={4}>
        <Text style={{ color: colors.text[theme].secondary }}>Status</Text>
        <Row gap={8}>
          {["all", "pending", "processing", "completed", "failed"].map(
            (status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? undefined : "outline"}
                onPress={() => onStatusChange(status)}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            )
          )}
        </Row>
      </Stack>

      <Stack gap={4}>
        <Text style={{ color: colors.text[theme].secondary }}>Type</Text>
        <Row gap={8}>
          {["all", "export", "deletion", "correction", "opt_out"].map(
            (type) => (
              <Button
                key={type}
                size="sm"
                variant={typeFilter === type ? undefined : "outline"}
                onPress={() => onTypeChange(type)}
              >
                {type === "all"
                  ? "All"
                  : type.replace("_", " ").charAt(0).toUpperCase() +
                    type.replace("_", " ").slice(1)}
              </Button>
            )
          )}
        </Row>
      </Stack>

      <Stack gap={4}>
        <Text style={{ color: colors.text[theme].secondary }}>Priority</Text>
        <Row gap={8}>
          {["all", "urgent", "high", "medium", "low"].map((priority) => (
            <Button
              key={priority}
              size="sm"
              variant={priorityFilter === priority ? undefined : "outline"}
              onPress={() => onPriorityChange(priority)}
            >
              {priority === "all"
                ? "All"
                : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Button>
          ))}
        </Row>
      </Stack>
    </Row>
  );
}

/**
 * CCPA Admin Dashboard Component
 */
export function CCPAAdminDashboard() {
  const { theme } = useThemeContext();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [_selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Fetch compliance metrics
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = useCCPAComplianceMetrics();

  // Fetch all CCPA requests
  const {
    data: requests,
    isLoading: isLoadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = useCCPAAdminRequests({
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    limit: 50,
  });

  // Process request mutation
  const processRequest = useCCPAProcessRequestMutation({
    onSuccess: () => {
      refetchRequests();
    },
  });

  const isLoading = isLoadingMetrics || isLoadingRequests;
  const hasError = metricsError || requestsError;

  if (hasError) {
    return (
      <Stack padding="md" gap={16} align="center" justify="center" flex={1}>
        <Text
          style={{
            color: theme === "light" ? colors.error[700] : colors.error[300],
          }}
        >
          Error Loading CCPA Dashboard
        </Text>
        <Text
          style={{
            color: colors.text[theme].secondary,
            textAlign: "center" as const,
          }}
        >
          {metricsError?.message || requestsError?.message}
        </Text>
        <Button onPress={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </Stack>
    );
  }

  const handleViewRequest = (id: string) => {
    setSelectedRequest(id);
    // Open detail modal or navigate to detail page
  };

  const handleAssignRequest = (_id: string) => {
    // Open assignment modal
  };

  const handleProcessRequest = (id: string) => {
    processRequest.mutate(id);
  };

  return (
    <ScrollView>
      <Stack padding="md" gap={24} style={{ maxWidth: 1400 }}>
        {/* Page Header */}
        <Stack gap={8}>
          <Text>CCPA Compliance Dashboard</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Manage CCPA requests, monitor compliance metrics, and ensure
            regulatory compliance.
          </Text>
        </Stack>

        {/* Compliance Metrics */}
        <Stack gap={12}>
          <Text>Compliance Metrics</Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner size="lg" />
            </Row>
          ) : (
            <Row gap={12} wrap>
              <MetricCard
                label="Total Requests"
                value={metrics?.total_requests || 0}
                trend="neutral"
              />
              <MetricCard
                label="Pending"
                value={metrics?.pending_requests || 0}
                color={
                  metrics?.pending_requests
                    ? theme === "light"
                      ? colors.yellow[700]
                      : colors.yellow[300]
                    : colors.text[theme].primary
                }
              />
              <MetricCard
                label="Processing"
                value={metrics?.processing_requests || 0}
                color={theme === "light" ? colors.blue[700] : colors.blue[300]}
              />
              <MetricCard
                label="Completed"
                value={metrics?.completed_requests || 0}
                color={
                  theme === "light" ? colors.green[700] : colors.green[300]
                }
                trend="up"
              />
              <MetricCard
                label="Avg Processing Days"
                value={`${metrics?.average_processing_days?.toFixed(1) || 0}`}
                color={
                  (metrics?.average_processing_days || 0) > 30
                    ? theme === "light"
                      ? colors.yellow[700]
                      : colors.yellow[300]
                    : theme === "light"
                    ? colors.green[700]
                    : colors.green[300]
                }
              />
              <MetricCard
                label="Compliance Rate"
                value={`${((metrics?.compliance_rate || 0) * 100).toFixed(1)}%`}
                color={
                  (metrics?.compliance_rate || 0) >= 0.95
                    ? theme === "light"
                      ? colors.green[700]
                      : colors.green[300]
                    : (metrics?.compliance_rate || 0) >= 0.8
                    ? theme === "light"
                      ? colors.yellow[700]
                      : colors.yellow[300]
                    : theme === "light"
                    ? colors.error[700]
                    : colors.error[300]
                }
              />
              <MetricCard
                label="Overdue Requests"
                value={metrics?.overdue_count || 0}
                color={
                  metrics?.overdue_count
                    ? theme === "light"
                      ? colors.error[700]
                      : colors.error[300]
                    : theme === "light"
                    ? colors.green[700]
                    : colors.green[300]
                }
              />
            </Row>
          )}
        </Stack>

        {/* 45-Day Deadline Warning */}
        {(metrics?.overdue_count || 0) > 0 && (
          <Row
            padding="md"
            style={{
              backgroundColor:
                theme === "light" ? colors.error[50] : colors.error[900],
            }}
            borderRadius={12}
            borderWidth={1}
            borderColor={
              theme === "light" ? colors.error[300] : colors.error[700]
            }
            gap={8}
            align="center"
          >
            <Text
              style={{
                color:
                  theme === "light" ? colors.error[700] : colors.error[300],
              }}
            >
              ATTENTION: {metrics?.overdue_count} request(s) have exceeded the
              45-day CCPA deadline. Immediate action required.
            </Text>
          </Row>
        )}

        {/* Request Filters */}
        <Stack gap={12}>
          <Text>Request Management</Text>
          <FilterBar
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            priorityFilter={priorityFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onPriorityChange={setPriorityFilter}
          />
        </Stack>

        {/* Request List */}
        <Stack gap={8}>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner size="lg" />
            </Row>
          ) : requests?.requests?.length === 0 ? (
            <Stack
              padding="xl"
              style={{ backgroundColor: colors.bg[theme].subtle }}
              borderRadius={12}
              borderWidth={1}
              borderColor={colors.border[theme].default}
              align="center"
              gap={8}
            >
              <Text style={{ color: colors.text[theme].secondary }}>
                No requests match the current filters
              </Text>
            </Stack>
          ) : (
            requests?.requests?.map((request, _index, _array) => (
              <RequestRow
                key={request.id}
                request={request as AdminCCPARequest}
                onView={handleViewRequest}
                onAssign={handleAssignRequest}
                onProcess={handleProcessRequest}
              />
            ))
          )}
        </Stack>

        {/* Quick Actions */}
        <Stack gap={12}>
          <Text>Quick Actions</Text>
          <Row gap={12} wrap>
            <Button size="md">Generate Compliance Report</Button>
            <Button size="md" variant="outline">
              Export All Requests
            </Button>
            <Button size="md" variant="outline">
              View Breach Notifications
            </Button>
            <Button size="md" variant="outline">
              Audit Log
            </Button>
          </Row>
        </Stack>

        {/* CCPA Timeline Requirements */}
        <Stack
          gap={12}
          padding="md"
          style={{ backgroundColor: colors.bg[theme].subtle }}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border[theme].default}
        >
          <Text>CCPA Timeline Requirements</Text>
          <Stack gap={8}>
            <Row gap={8} align="center">
              <Stack
                width={8}
                height={8}
                borderRadius={4}
                style={{
                  backgroundColor:
                    theme === "light" ? colors.blue[700] : colors.blue[300],
                }}
              />
              <Text style={{ color: colors.text[theme].secondary }}>
                <Text>10 days</Text> - Acknowledge receipt of request
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack
                width={8}
                height={8}
                borderRadius={4}
                style={{
                  backgroundColor:
                    theme === "light" ? colors.yellow[700] : colors.yellow[300],
                }}
              />
              <Text style={{ color: colors.text[theme].secondary }}>
                <Text>45 days</Text> - Complete request (with possible 45-day
                extension)
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack
                width={8}
                height={8}
                borderRadius={4}
                style={{
                  backgroundColor:
                    theme === "light" ? colors.green[700] : colors.green[300],
                }}
              />
              <Text style={{ color: colors.text[theme].secondary }}>
                <Text>12 months</Text> - Retain request records
              </Text>
            </Row>
            <Row gap={8} align="center">
              <Stack
                width={8}
                height={8}
                borderRadius={4}
                style={{
                  backgroundColor:
                    theme === "light" ? colors.error[700] : colors.error[300],
                }}
              />
              <Text style={{ color: colors.text[theme].secondary }}>
                <Text>72 hours</Text> - Notify users of data breaches
              </Text>
            </Row>
          </Stack>
        </Stack>
      </Stack>
    </ScrollView>
  );
}

export default CCPAAdminDashboard;
