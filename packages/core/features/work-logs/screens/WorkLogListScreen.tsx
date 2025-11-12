// @ts-nocheck
import { useCallback, useMemo, type ComponentType } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  Paragraph,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { Activity, CloudOff, DownloadCloud, MessagesSquare, Plus } from "@tamagui/lucide-icons";

import { RouteBuilder } from "@app/core/constants/routes";
import { formatDate } from "@app/core/features/profile/utils/date-formatting";
import { api } from "@app/core/utils/api";

import { useOfflineWorkLogs } from "../hooks/useOfflineWorkLogs";
import { useWorkLogSync } from "../hooks/useWorkLogSync";
import { getStatusColor, getStatusLabel } from "../utils/status-formatting";

type IconRenderer = ComponentType<{ size?: number; color?: string }>;

export function WorkLogListScreen() {
  const router = useRouter();

  const listQuery = api.workLogs.list.useQuery({}, {
    staleTime: 30_000,
    refetchOnMount: "always",
  });

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

  const aggregates = useMemo(() => listQuery.data?.aggregates, [listQuery.data]);
  const items = listQuery.data?.items ?? [];

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
      <YStack gap="$4" p="$4" flex={1}>
        <XStack justify="space-between" items="center">
          <YStack gap="$1">
            <Text fontSize="$7" fontWeight="700">
              Work Logs
            </Text>
            <Paragraph color="$color10">
              Track and review your daily work history, collaborate with teammates, and manage verification.
            </Paragraph>
          </YStack>
          <Button
            size="$4"
            icon={Plus}
            onPress={() => router.push(RouteBuilder.dashboardWorkLogCreate())}
          >
            New Work Log
          </Button>
        </XStack>

        {hasOfflineQueue && (
          <Card bg="$yellow3" borderColor="$yellow7" borderWidth={1}>
            <Card.Body gap="$3">
              <XStack gap="$3" items="center">
                <CloudOff color="#b45309" />
                <YStack gap="$1" flex={1}>
                  <Text fontWeight="600" color="$yellow11">
                    Offline drafts ready to sync
                  </Text>
                  <Paragraph color="$yellow11">
                    {offlineWorkLogs.length} draft{offlineWorkLogs.length === 1 ? "" : "s"} will sync once you are back online.
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack gap="$3" justify="flex-end">
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={syncManager.isSyncing || isOfflineLoading}
                  onPress={() => syncManager.syncNow()}
                >
                  {syncManager.isSyncing ? "Syncing…" : "Sync Now"}
                </Button>
              </XStack>
            </Card.Body>
          </Card>
        )}

        <AnalyticsBanner
          isLoading={listQuery.isLoading}
          totalLogs={listQuery.data?.pagination.totalItems ?? 0}
          totalHours={aggregates?.totalHours ?? 0}
          statusSummary={aggregates?.statusSummary}
        />

        <Separator />

        {listQuery.isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Spinner size="large" />
            <Text color="$color10">Loading work logs…</Text>
          </YStack>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => router.push(RouteBuilder.dashboardWorkLogCreate())} />
        ) : (
          <YStack gap="$3" pb="$6">
            {items.map((item) => (
              <Card
                key={item.id}
                hoverStyle={{ borderColor: "$color10" }}
                pressStyle={{ borderColor: "$color8" }}
                borderColor="$color6"
                borderWidth={1}
                onPress={() =>
                  router.push(
                    RouteBuilder.dashboardWorkLogDetail(item.id),
                  )}
              >
                <Card.Body gap="$3">
                  <XStack justify="space-between" items="center">
                    <YStack gap="$1">
                      <Text fontWeight="700" fontSize="$6">
                        {item.project?.name ?? "Unknown Project"}
                      </Text>
                      <Text color="$color10">
                        {item.logDate ? formatDate(item.logDate) : "No date recorded"}
                      </Text>
                    </YStack>
                    <Text
                      fontWeight="600"
                      color={getStatusColor(item.status)}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </XStack>

                  <XStack gap="$4" flexWrap="wrap">
                    <MetricPill
                      icon={Activity}
                      label="Hours"
                      value={`${item.totalHours.toFixed(2)}h`}
                    />
                    <MetricPill
                      icon={MessagesSquare}
                      label="Comments"
                      value={String(item.commentCount)}
                    />
                    <MetricPill
                      icon={DownloadCloud}
                      label="Photos"
                      value={String(item.photoCount)}
                    />
                  </XStack>

                  {item.descriptionPreview && (
                    <Paragraph numberOfLines={2} color="$color10">
                      {item.descriptionPreview}
                    </Paragraph>
                  )}

                  <XStack justify="space-between" items="center">
                    <Text color="$color10" fontSize="$3">
                      Updated {item.updatedAt ? formatDate(item.updatedAt) : "recently"}
                    </Text>
                    <Button
                      size="$3"
                      variant="outlined"
                      onPress={() =>
                        router.push(
                          RouteBuilder.dashboardWorkLogDetail(item.id),
                        )}
                    >
                      View Details
                    </Button>
                  </XStack>
                </Card.Body>
              </Card>
            ))}
          </YStack>
        )}
      </YStack>
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
    <Card borderColor="$color6" borderWidth={1}>
      <Card.Body gap="$3">
        <Text fontWeight="700" fontSize="$5">
          Quick summary
        </Text>
        {isLoading && !statusSummary ? (
          <XStack gap="$3" items="center">
            <Spinner size="small" />
            <Text color="$color10">Calculating analytics…</Text>
          </XStack>
        ) : (
          <YStack gap="$3">
            <XStack gap="$4" flexWrap="wrap">
              <SummaryTile label="Total Logs" value={String(totalLogs)} />
              <SummaryTile
                label="Total Hours"
                value={`${totalHours.toFixed(2)}h`}
              />
              <SummaryTile
                label="Verified"
                value={String(statusSummary?.verified.count ?? 0)}
                subtitle={`${(statusSummary?.verified.hours ?? 0).toFixed(1)}h`}
                color="$green10"
              />
              <SummaryTile
                label="Needs Attention"
                value={String(
                  (statusSummary?.pending_verification.count ?? 0) +
                    (statusSummary?.disputed.count ?? 0),
                )}
                subtitle={`${(
                  (statusSummary?.pending_verification.hours ?? 0) +
                  (statusSummary?.disputed.hours ?? 0)
                ).toFixed(1)}h`}
                color="$orange10"
              />
            </XStack>
          </YStack>
        )}
      </Card.Body>
    </Card>
  );
}

interface SummaryTileProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

function SummaryTile({ label, value, subtitle, color = "$color12" }: SummaryTileProps) {
  return (
    <YStack
      bg="$color2"
      borderRadius="$4"
      px="$4"
      py="$3"
      gap="$1"
      flexShrink={0}
    >
      <Text fontWeight="600" color="$color10">
        {label}
      </Text>
      <Text fontSize="$6" fontWeight="700" color={color}>
        {value}
      </Text>
      {subtitle && (
        <Text fontSize="$3" color="$color10">
          {subtitle}
        </Text>
      )}
    </YStack>
  );
}

interface MetricPillProps {
  icon: IconRenderer;
  label: string;
  value: string;
}

function MetricPill({ icon: IconComponent, label, value }: MetricPillProps) {
  return (
    <XStack
      bg="$color3"
      px="$3"
      py="$2"
      borderRadius="$4"
      gap="$2"
      items="center"
    >
      <IconComponent size={16} color="currentColor" />
      <Text fontWeight="600">{value}</Text>
      <Text fontSize="$3" color="$color10">
        {label}
      </Text>
    </XStack>
  );
}

interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card borderColor="$color6" borderWidth={1}>
      <Card.Body gap="$3" alignItems="center" py="$8">
        <Text fontSize="$6" fontWeight="700">
          No work logs yet
        </Text>
        <Paragraph color="$color10" textAlign="center" px="$6">
          Create your first work log to start tracking hours, documenting tasks, and collaborating with your team.
        </Paragraph>
        <Button size="$4" icon={DownloadCloud} onPress={onCreate}>
          Record Work Log
        </Button>
      </Card.Body>
    </Card>
  );
}

