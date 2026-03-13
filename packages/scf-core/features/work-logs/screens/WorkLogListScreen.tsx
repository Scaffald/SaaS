import { ROUTES, RouteBuilder, buildPath } from "@scf/core/constants/routes";
import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import { useWorkLogs } from "@scf/core/utils/work-logs-sdk-hooks";
import {
  Activity,
  CloudOff,
  DownloadCloud,
  MessagesSquare,
  Plus,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, ScrollView } from "react-native";
import {
  Button,
  Card,
  Separator,
  Skeleton,
  SkeletonBox,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";

import { useOfflineWorkLogs } from "../hooks/useOfflineWorkLogs";
import { useWorkLogSync } from "../hooks/useWorkLogSync";
import type { WorkLogListItem } from "@scaffald/sdk";
import { getStatusColor, getStatusLabel } from "../utils/status-formatting";

type IconRenderer = typeof Activity;

export type WorkLogListScreenProps = {
  /** When set, list is scoped to this organization and create/detail links use org routes */
  organizationId?: string;
  orgSlug?: string;
};

export function WorkLogListScreen({ organizationId, orgSlug }: WorkLogListScreenProps = {}) {
  const router = useRouter();
  const { theme } = useThemeContext();

  const listQuery = useWorkLogs(
    organizationId ? { organizationId } : {},
    {
      staleTime: 30_000,
      refetchOnMount: "always",
    }
  );

  const createPath = orgSlug ? RouteBuilder.orgLogsCreate(orgSlug) : ROUTES.DASHBOARD.WORK_LOGS.CREATE.path;
  const detailPath = (workLogId: string) =>
    orgSlug ? RouteBuilder.orgLogDetail(orgSlug, workLogId) : buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId });

  const {
    offlineWorkLogs,
    isLoading: isOfflineLoading,
    markWorkLogForSync,
    mutateOfflineWorkLog,
    removeOfflineWorkLog,
  } = useOfflineWorkLogs();

  const syncManager = useWorkLogSync({
    offlineWorkLogs,
    markWorkLogForSync,
    mutateOfflineWorkLog,
    removeOfflineWorkLog,
  });

  const hasOfflineQueue = offlineWorkLogs.length > 0;

  const handleRefresh = useCallback(() => {
    void listQuery.refetch();
  }, [listQuery]);

  const aggregates = null as {
    totalHours?: number;
    statusSummary?: {
      draft: { count: number; hours: number };
      pending_verification: { count: number; hours: number };
      verified: { count: number; hours: number };
      disputed: { count: number; hours: number };
    };
  } | null;
  const items: WorkLogListItem[] = listQuery.data?.workLogs ?? [];

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={listQuery.isFetching}
          onRefresh={handleRefresh}
        />
      }
    >
      <Stack gap={16} style={{ padding: 16 }} flex={1}>
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <Text>Work Logs</Text>
            <Text style={{ color: "#414e62" }}>
              Track and review your daily work history, collaborate with
              teammates, and manage verification.
            </Text>
          </Stack>
          <Button
            size="md"
            iconStart={Plus}
            onPress={() => router.push(createPath)}
          >
            New Work Log
          </Button>
        </Row>

        {hasOfflineQueue && (
          <Card
            style={{
              backgroundColor: "#fef3c7",
              borderColor: "#fbbf24",
              borderWidth: 1,
            }}
          >
            <Stack gap={12} style={{ padding: 8 }}>
              <Row gap={12} align="center">
                <CloudOff color="#b45309" />
                <Stack gap={4} flex={1}>
                  <Text style={{ color: "#92400e" }}>
                    Offline drafts ready to sync
                  </Text>
                  <Text style={{ color: "#92400e" }}>
                    {offlineWorkLogs.length} draft
                    {offlineWorkLogs.length === 1 ? "" : "s"} will sync once you
                    are back online.
                  </Text>
                </Stack>
              </Row>
              <Row gap={12} justify="flex-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={syncManager.isSyncing || isOfflineLoading}
                  onPress={() => syncManager.syncNow()}
                >
                  {syncManager.isSyncing ? "Syncing…" : "Sync Now"}
                </Button>
              </Row>
            </Stack>
          </Card>
        )}

        <AnalyticsBanner
          isLoading={listQuery.isLoading}
          totalLogs={listQuery.data?.totalCount ?? 0}
          totalHours={aggregates?.totalHours ?? 0}
          statusSummary={aggregates?.statusSummary}
        />

        <Separator />

        {listQuery.isLoading ? (
          <Stack gap={12} paddingBottom={24}>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} style={{ borderWidth: 1 }}>
                <Stack gap={12} style={{ padding: 8 }}>
                  <Row justify="space-between" align="center">
                    <Stack gap={4}>
                      <Skeleton width={80} height={14} shape="text" />
                      <Skeleton width={100} height={12} shape="text" />
                    </Stack>
                    <SkeletonBox width={70} height={24} borderRadius={99} />
                  </Row>
                  <SkeletonText lines={2} lastLineWidth="60%" />
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : items.length === 0 ? (
          <EmptyState
            onCreate={() => router.push(createPath)}
          />
        ) : (
          <Stack gap={12} paddingBottom={24}>
            {items.map((item) => (
              <Card
                key={item.id}
                style={{ borderWidth: 1 }}
                onPress={() => router.push(detailPath(item.id))}
              >
                <Stack gap={12} style={{ padding: 8 }}>
                  <Row justify="space-between" align="center">
                    <Stack gap={4}>
                      <Text>{"Work Log"}</Text>
                      <Text style={{ color: "#414e62" }}>
                        {item.log_date
                          ? formatDate(item.log_date)
                          : "No date recorded"}
                      </Text>
                    </Stack>
                    <Text style={{ color: getStatusColor(item.status, theme) }}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </Row>

                  <Row gap={8} wrap>
                    <Stack
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor:
                          item.visibility === "public" ? "#dcfce7" : "#f3f4f6",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            item.visibility === "public"
                              ? "#16a34a"
                              : "#414e62",
                        }}
                      >
                        {item.visibility === "public" ? "Public" : "Private"}
                      </Text>
                    </Stack>
                    {item.show_on_profile && (
                      <Stack
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                          backgroundColor: "#dbeafe",
                        }}
                      >
                        <Text style={{ color: "#1d4ed8" }}>On profile</Text>
                      </Stack>
                    )}
                  </Row>

                  <Row gap={16} wrap>
                    <MetricPill
                      iconStart={Activity}
                      label="Hours"
                      value={`${item.total_hours.toFixed(2)}h`}
                    />
                    <MetricPill
                      iconStart={MessagesSquare}
                      label="Comments"
                      value={`${item.commentCount ?? 0}`}
                    />
                    <MetricPill
                      iconStart={DownloadCloud}
                      label="Photos"
                      value={`${item.photoCount ?? 0}`}
                    />
                  </Row>

                  {item.work_description && (
                    <Text style={{ color: "#414e62" }}>
                      {item.work_description}
                    </Text>
                  )}

                  <Row justify="space-between" align="center">
                    <Text style={{ color: "#414e62" }}>
                      Updated{" "}
                      {item.updated_at
                        ? formatDate(item.updated_at)
                        : "recently"}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() =>
                        router.push(detailPath(item.id))
                      }
                    >
                      View Details
                    </Button>
                  </Row>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </ScrollView>
  );
}

interface AnalyticsBannerProps {
  isLoading: boolean;
  totalLogs: number;
  totalHours: number;
  statusSummary?: {
    draft: { count: number; hours: number };
    pending_verification: { count: number; hours: number };
    verified: { count: number; hours: number };
    disputed: { count: number; hours: number };
  };
}

function AnalyticsBanner({
  isLoading,
  totalLogs,
  totalHours,
  statusSummary,
}: AnalyticsBannerProps) {
  return (
    <Card style={{ borderWidth: 1 }}>
      <Stack gap={12} style={{ padding: 8 }}>
        <Text>Quick summary</Text>
        {isLoading && !statusSummary ? (
          <Row gap={8} wrap>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} width={80} height={48} borderRadius={8} />
            ))}
          </Row>
        ) : (
          <Stack gap={12}>
            <Row gap={16} wrap>
              <SummaryTile label="Total Logs" value={String(totalLogs)} />
              <SummaryTile
                label="Total Hours"
                value={`${totalHours.toFixed(2)}h`}
              />
              <SummaryTile
                label="Verified"
                value={String(statusSummary?.verified.count ?? 0)}
                subtitle={`${(statusSummary?.verified.hours ?? 0).toFixed(1)}h`}
                color="#16a34a"
              />
              <SummaryTile
                label="Needs Attention"
                value={String(
                  (statusSummary?.pending_verification.count ?? 0) +
                    (statusSummary?.disputed.count ?? 0)
                )}
                subtitle={`${(
                  (statusSummary?.pending_verification.hours ?? 0) +
                  (statusSummary?.disputed.hours ?? 0)
                ).toFixed(1)}h`}
                color="#ea580c"
              />
            </Row>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

function SummaryTile({ label, value, subtitle, color }: SummaryTileProps) {
  return (
    <Stack
      style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 }}
      gap={4}
      flexShrink={0}
    >
      <Text style={{ color: "#414e62" }}>{label}</Text>
      <Text style={color ? { color } : undefined}>{value}</Text>
      {subtitle && <Text style={{ color: "#414e62" }}>{subtitle}</Text>}
    </Stack>
  );
}

interface MetricPillProps {
  iconStart: IconRenderer;
  label: string;
  value: string;
}

function MetricPill({
  iconStart: IconComponent,
  label,
  value,
}: MetricPillProps) {
  return (
    <Row
      style={{ borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}
      gap={8}
      align="center"
    >
      <IconComponent size="md" color="#414e62" />
      <Text>{value}</Text>
      <Text style={{ color: "#414e62" }}>{label}</Text>
    </Row>
  );
}

interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card style={{ borderWidth: 1 }}>
      <Stack
        gap={12}
        align="center"
        style={{ paddingVertical: 32, paddingHorizontal: 16 }}
      >
        <Text>No work logs yet</Text>
        <Text
          style={{
            color: "#414e62",
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          Create your first work log to start tracking hours, documenting tasks,
          and collaborating with your team.
        </Text>
        <Button size="md" iconStart={DownloadCloud} onPress={onCreate}>
          Record Work Log
        </Button>
      </Stack>
    </Card>
  );
}
