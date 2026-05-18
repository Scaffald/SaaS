import { ROUTES, RouteBuilder, buildPath } from "@scf/core/constants/routes";
import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import { useWorkLogs, useWorkLogsOverview } from "@scf/core/utils/work-logs-sdk-hooks";
import {
  Activity,
  ArrowDownAZ,
  ArrowDownZA,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudOff,
  MessagesSquare,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import {
  Button,
  Caption,
  Card,
  Dropdown,
  DropdownItem,
  H4,
  Heading,
  Input,
  Paragraph,
  SegmentedControl,
  Separator,
  Skeleton,
  SkeletonBox,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

import { useOfflineWorkLogs } from "../hooks/useOfflineWorkLogs";
import { useWorkLogSync } from "../hooks/useWorkLogSync";
import type {
  ListWorkLogsParams,
  WorkLogListItem,
  WorkLogOverview,
  WorkLogStatus,
} from "@scaffald/sdk";
import { getStatusBg, getStatusColor, getStatusLabel } from "../utils/status-formatting";

const TITLE_MAX_LENGTH = 64;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type IconRenderer = typeof Activity;
type SortField = NonNullable<ListWorkLogsParams["sortField"]>;
type SortDirection = NonNullable<ListWorkLogsParams["sortDirection"]>;
type StatusFilter = "all" | WorkLogStatus;
type Theme = "light" | "dark";

interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { field: "log_date", direction: "desc", label: "Newest log date" },
  { field: "log_date", direction: "asc", label: "Oldest log date" },
  { field: "updated_at", direction: "desc", label: "Recently updated" },
  { field: "total_hours", direction: "desc", label: "Most hours" },
] as const;

const STATUS_FILTERS: readonly StatusFilter[] = [
  "all",
  "draft",
  "pending_verification",
  "verified",
  "disputed",
] as const;

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  draft: "Draft",
  pending_verification: "Pending",
  verified: "Verified",
  disputed: "Disputed",
};

type DateBucket = "today" | "yesterday" | "this_week" | "this_month" | "older" | "undated";

const BUCKET_LABELS: Record<DateBucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  this_month: "This month",
  older: "Earlier",
  undated: "No date",
};

const BUCKET_ORDER: readonly DateBucket[] = [
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "older",
  "undated",
];

function getDateBucket(logDate: string | null | undefined, now: Date = new Date()): DateBucket {
  if (!logDate) return "undated";
  const d = new Date(logDate);
  if (Number.isNaN(d.getTime())) return "undated";
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = startOfDay(now);
  const logDay = startOfDay(d);
  const diffDays = Math.floor((today.getTime() - logDay.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "this_week";
  if (diffDays < 30) return "this_month";
  return "older";
}

function resolveCardTitle(item: WorkLogListItem): string {
  const desc = item.work_description?.trim();
  if (desc) {
    const firstLine = desc.split(/\r?\n/)[0]?.trim() ?? "";
    if (firstLine) {
      return firstLine.length > TITLE_MAX_LENGTH
        ? `${firstLine.slice(0, TITLE_MAX_LENGTH - 1)}…`
        : firstLine;
    }
  }
  if (item.log_date) {
    return `Work log · ${formatDate(item.log_date)}`;
  }
  return `Work log #${item.id.slice(0, 6)}`;
}

export type WorkLogListScreenProps = {
  /** When set, list is scoped to this organization and create/detail links use org routes */
  organizationId?: string;
  orgSlug?: string;
};

export function WorkLogListScreen({ organizationId, orgSlug }: WorkLogListScreenProps = {}) {
  const router = useRouter();
  const { theme } = useThemeContext();
  const t: Theme = theme === "dark" ? "dark" : "light";

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortIndex, setSortIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const sort = SORT_OPTIONS[sortIndex] ?? SORT_OPTIONS[0];

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const listParams = useMemo<ListWorkLogsParams>(() => {
    const params: ListWorkLogsParams = {
      page,
      pageSize: PAGE_SIZE,
      sortField: sort.field,
      sortDirection: sort.direction,
    };
    if (organizationId) params.organizationId = organizationId;
    if (statusFilter !== "all") params.statuses = [statusFilter];
    if (searchQuery.length >= 2) params.search = searchQuery;
    return params;
  }, [organizationId, page, sort.field, sort.direction, statusFilter, searchQuery]);

  const listQuery = useWorkLogs(listParams, {
    staleTime: 30_000,
    refetchOnMount: "always",
  });

  const overviewQuery = useWorkLogsOverview();

  const createPath = orgSlug ? RouteBuilder.orgLogsCreate(orgSlug) : ROUTES.EMPLOYERS.LOGS.CREATE.path;
  const detailPath = (workLogId: string) =>
    orgSlug ? RouteBuilder.orgLogDetail(orgSlug, workLogId) : buildPath(ROUTES.EMPLOYERS.LOGS.DETAIL, { workLogId });

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
    void overviewQuery.refetch();
  }, [listQuery, overviewQuery]);

  const items: WorkLogListItem[] = listQuery.data?.workLogs ?? [];
  const totalCount = listQuery.data?.totalCount ?? 0;
  const hasMore = listQuery.data?.hasMore ?? false;
  const statusSummary = overviewQuery.data?.statusSummary;
  const totalHours = overviewQuery.data?.totalHours ?? 0;
  const showAnalytics = items.length > 0 || listQuery.isLoading;
  const isFiltering = statusFilter !== "all" || searchQuery.length >= 2;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const selectedStatusIndex = Math.max(0, STATUS_FILTERS.indexOf(statusFilter));

  const groupedItems = useMemo(() => {
    const buckets = new Map<DateBucket, WorkLogListItem[]>();
    const now = new Date();
    for (const item of items) {
      const bucket = getDateBucket(item.log_date, now);
      const existing = buckets.get(bucket);
      if (existing) {
        existing.push(item);
      } else {
        buckets.set(bucket, [item]);
      }
    }
    return BUCKET_ORDER.flatMap<{ bucket: DateBucket; items: WorkLogListItem[] }>((b) => {
      const arr = buckets.get(b);
      return arr?.length ? [{ bucket: b, items: arr }] : [];
    });
  }, [items]);

  const isInitialLoading = listQuery.isLoading && page === 0;
  const isShowingEmpty = !listQuery.isLoading && items.length === 0;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={listQuery.isRefetching}
          onRefresh={handleRefresh}
        />
      }
    >
      <Stack gap={16} style={{ padding: 16 }} flex={1}>
        <Row justify="space-between" align="center" gap={16}>
          <Paragraph size="sm" color="secondary" style={{ flexShrink: 1 }}>
            Track and review your daily work history, collaborate with
            teammates, and manage verification.
          </Paragraph>
          <Button
            size="md"
            iconStart={Plus}
            onPress={() => router.push(createPath)}
          >
            New Work Log
          </Button>
        </Row>

        {hasOfflineQueue && (
          <OfflineSyncCard
            t={t}
            count={offlineWorkLogs.length}
            isSyncing={syncManager.isSyncing}
            disabled={isOfflineLoading}
            onSync={() => syncManager.syncNow()}
          />
        )}

        {showAnalytics && (
          <AnalyticsBanner
            isLoading={overviewQuery.isLoading}
            totalLogs={overviewQuery.data?.totalEntries ?? totalCount}
            totalHours={totalHours}
            statusSummary={statusSummary}
          />
        )}

        <FilterBar
          t={t}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          selectedStatusIndex={selectedStatusIndex}
          onStatusChange={(i) => {
            setStatusFilter(STATUS_FILTERS[i] ?? "all");
            setPage(0);
          }}
          sortLabel={sort.label}
          sortDirection={sort.direction}
          sortMenuOpen={sortMenuOpen}
          onSortMenuOpenChange={setSortMenuOpen}
          onSortSelect={(idx) => {
            setSortIndex(idx);
            setSortMenuOpen(false);
            setPage(0);
          }}
          sortIndex={sortIndex}
        />

        <Separator />

        {isInitialLoading ? (
          <SkeletonList />
        ) : isShowingEmpty ? (
          isFiltering ? (
            <FilteredEmptyState
              t={t}
              onClear={() => {
                setSearchInput("");
                setSearchQuery("");
                setStatusFilter("all");
                setPage(0);
              }}
            />
          ) : (
            <EmptyState
              t={t}
              onCreate={() => router.push(createPath)}
            />
          )
        ) : (
          <Stack gap={20} paddingBottom={24}>
            {groupedItems.map(({ bucket, items: bucketItems }) => (
              <Stack key={bucket} gap={12}>
                <Row justify="space-between" align="center">
                  <H4 weight="semibold">{BUCKET_LABELS[bucket]}</H4>
                  <Caption color="tertiary">
                    {bucketItems.length} {bucketItems.length === 1 ? "log" : "logs"}
                  </Caption>
                </Row>
                <Stack gap={12}>
                  {bucketItems.map((item) => (
                    <WorkLogCard
                      key={item.id}
                      t={t}
                      item={item}
                      onPress={() => router.push(detailPath(item.id))}
                    />
                  ))}
                </Stack>
              </Stack>
            ))}

            {(totalCount > PAGE_SIZE || page > 0) && (
              <PaginationFooter
                page={page}
                totalPages={totalPages}
                hasMore={hasMore}
                isFetching={listQuery.isFetching}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            )}
          </Stack>
        )}
      </Stack>
    </ScrollView>
  );
}

interface OfflineSyncCardProps {
  t: Theme;
  count: number;
  isSyncing: boolean;
  disabled: boolean;
  onSync: () => void;
}

function OfflineSyncCard({ t, count, isSyncing, disabled, onSync }: OfflineSyncCardProps) {
  const tint = t === "dark" ? colors.warning[900] : colors.warning[50];
  const border = colors.border[t].warning;
  const icon = colors.fg[t].warning;
  return (
    <Card
      padding="lg"
      style={{
        backgroundColor: tint,
        borderColor: border,
        borderWidth: 1,
      }}
    >
      <Stack gap={12}>
        <Row gap={12} align="center">
          <CloudOff color={icon} />
          <Stack gap={4} flex={1}>
            <Text size="md" weight="semibold">
              Offline drafts ready to sync
            </Text>
            <Paragraph size="sm" color="secondary">
              {count} draft{count === 1 ? "" : "s"} will sync once you are back online.
            </Paragraph>
          </Stack>
        </Row>
        <Row gap={12} justify="flex-end">
          <Button
            size="sm"
            variant="outline"
            disabled={isSyncing || disabled}
            onPress={onSync}
          >
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        </Row>
      </Stack>
    </Card>
  );
}

interface FilterBarProps {
  t: Theme;
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedStatusIndex: number;
  onStatusChange: (index: number) => void;
  sortLabel: string;
  sortDirection: SortDirection;
  sortMenuOpen: boolean;
  onSortMenuOpenChange: (open: boolean) => void;
  onSortSelect: (index: number) => void;
  sortIndex: number;
}

function FilterBar({
  t,
  searchInput,
  onSearchChange,
  selectedStatusIndex,
  onStatusChange,
  sortLabel,
  sortDirection,
  sortMenuOpen,
  onSortMenuOpenChange,
  onSortSelect,
  sortIndex,
}: FilterBarProps) {
  const SortIcon = sortDirection === "asc" ? ArrowDownAZ : ArrowDownZA;
  return (
    <Stack gap={12}>
      <Row gap={12} align="center" wrap>
        <Stack flex={1} style={{ minWidth: 220 }}>
          <Input
            iconStart={Search}
            placeholder="Search work logs"
            value={searchInput}
            onChangeText={onSearchChange}
          />
        </Stack>
        <Dropdown
          open={sortMenuOpen}
          onOpenChange={onSortMenuOpenChange}
          trigger={
            <Row
              gap={8}
              align="center"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border[t].default,
                backgroundColor: colors.bg[t].default,
              }}
            >
              <SortIcon size={16} color={colors.text[t].secondary} />
              <Text size="sm">{sortLabel}</Text>
              <SlidersHorizontal size={14} color={colors.text[t].tertiary} />
            </Row>
          }
        >
          {SORT_OPTIONS.map((opt, idx) => (
            <DropdownItem
              key={`${opt.field}-${opt.direction}`}
              selected={idx === sortIndex}
              onPress={() => onSortSelect(idx)}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </Dropdown>
      </Row>
      <SegmentedControl
        segments={STATUS_FILTERS.map((s) => STATUS_FILTER_LABELS[s])}
        selectedIndex={selectedStatusIndex}
        onSelectionChange={onStatusChange}
      />
    </Stack>
  );
}

interface WorkLogCardProps {
  t: Theme;
  item: WorkLogListItem;
  onPress: () => void;
}

function WorkLogCard({ t, item, onPress }: WorkLogCardProps) {
  return (
    <Card
      padding="lg"
      style={{
        borderWidth: 1,
        borderColor: colors.border[t].default,
      }}
      onPress={onPress}
    >
      <Stack gap={12}>
        <Row justify="space-between" align="flex-start" gap={12}>
          <Stack gap={4} flex={1}>
            <Text size="md" weight="semibold">
              {resolveCardTitle(item)}
            </Text>
            <Caption color="secondary">
              {item.log_date ? formatDate(item.log_date) : "No date recorded"}
            </Caption>
          </Stack>
          <StatusPill t={t} status={item.status} />
        </Row>

        <Row gap={8} wrap>
          <VisibilityPill t={t} visibility={item.visibility} />
          {item.show_on_profile && <OnProfilePill t={t} />}
        </Row>

        <Row gap={8} wrap>
          <MetricPill
            t={t}
            iconStart={Activity}
            label="Hours"
            value={`${item.total_hours.toFixed(2)}h`}
          />
          <MetricPill
            t={t}
            iconStart={MessagesSquare}
            label="Comments"
            value={`${item.commentCount ?? 0}`}
          />
          <MetricPill
            t={t}
            iconStart={Camera}
            label="Photos"
            value={`${item.photoCount ?? 0}`}
          />
        </Row>

        {item.work_description && (
          <Paragraph size="sm" color="secondary" numberOfLines={3}>
            {item.work_description}
          </Paragraph>
        )}

        <Caption color="tertiary">
          Updated {item.updated_at ? formatDate(item.updated_at) : "recently"}
        </Caption>
      </Stack>
    </Card>
  );
}

interface StatusPillProps {
  t: Theme;
  status: string | null | undefined;
}

function StatusPill({ t, status }: StatusPillProps) {
  return (
    <Stack
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: getStatusBg(status, t),
      }}
    >
      <Text size="xs" weight="semibold" style={{ color: getStatusColor(status, t) }}>
        {getStatusLabel(status)}
      </Text>
    </Stack>
  );
}

interface VisibilityPillProps {
  t: Theme;
  visibility: string;
}

function VisibilityPill({ t, visibility }: VisibilityPillProps) {
  const isPublic = visibility === "public";
  const bg = isPublic
    ? t === "dark"
      ? colors.success[900]
      : colors.success[100]
    : colors.bg[t].muted;
  const fg = isPublic
    ? t === "dark"
      ? colors.success[300]
      : colors.success[700]
    : colors.text[t].secondary;
  return (
    <Stack
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Text size="xs" weight="medium" style={{ color: fg }}>
        {isPublic ? "Public" : "Private"}
      </Text>
    </Stack>
  );
}

function OnProfilePill({ t }: { t: Theme }) {
  const bg = t === "dark" ? colors.info[900] : colors.info[50];
  const fg = t === "dark" ? colors.info[300] : colors.info[700];
  return (
    <Stack
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      <Text size="xs" weight="medium" style={{ color: fg }}>
        On profile
      </Text>
    </Stack>
  );
}

interface AnalyticsBannerProps {
  isLoading: boolean;
  totalLogs: number;
  totalHours: number;
  statusSummary?: WorkLogOverview["statusSummary"];
}

function AnalyticsBanner({
  isLoading,
  totalLogs,
  totalHours,
  statusSummary,
}: AnalyticsBannerProps) {
  const { theme } = useThemeContext();
  const t: Theme = theme === "dark" ? "dark" : "light";
  const needsAttention =
    (statusSummary?.pending_verification.count ?? 0) +
    (statusSummary?.disputed.count ?? 0);
  const needsAttentionHours =
    (statusSummary?.pending_verification.hours ?? 0) +
    (statusSummary?.disputed.hours ?? 0);
  return (
    <Card variant="outlined" padding="lg">
      <Stack gap={12}>
        <Heading level={5} weight="semibold">
          Quick summary
        </Heading>
        {isLoading && !statusSummary ? (
          <Row gap={12} wrap>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBox key={i} width={120} height={64} borderRadius={12} />
            ))}
          </Row>
        ) : (
          <Row gap={12} wrap>
            <SummaryTile t={t} label="Total Logs" value={String(totalLogs)} />
            <SummaryTile
              t={t}
              label="Total Hours"
              value={`${totalHours.toFixed(2)}h`}
            />
            <SummaryTile
              t={t}
              label="Verified"
              value={String(statusSummary?.verified.count ?? 0)}
              subtitle={`${(statusSummary?.verified.hours ?? 0).toFixed(1)}h`}
              color={t === "dark" ? colors.success[400] : colors.success[600]}
              tone="success"
            />
            <SummaryTile
              t={t}
              label="Needs Attention"
              value={String(needsAttention)}
              subtitle={`${needsAttentionHours.toFixed(1)}h`}
              color={t === "dark" ? colors.warning[400] : colors.warning[600]}
              tone="warning"
            />
          </Row>
        )}
      </Stack>
    </Card>
  );
}

interface SummaryTileProps {
  t: Theme;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  tone?: "default" | "success" | "warning";
}

function SummaryTile({ t, label, value, subtitle, color, tone = "default" }: SummaryTileProps) {
  const toneBg = (() => {
    if (tone === "success") return t === "dark" ? colors.success[900] : colors.success[50];
    if (tone === "warning") return t === "dark" ? colors.warning[900] : colors.warning[50];
    return colors.bg[t].subtle;
  })();
  const toneBorder = (() => {
    if (tone === "success") return colors.border[t].success;
    if (tone === "warning") return colors.border[t].warning;
    return colors.border[t].default;
  })();
  return (
    <Stack
      style={{
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: toneBg,
        borderColor: toneBorder,
        borderWidth: 1,
        minWidth: 120,
      }}
      gap={4}
      flexShrink={0}
    >
      <Caption color="secondary">{label}</Caption>
      <Text size="xl" weight="bold" style={color ? { color } : undefined}>
        {value}
      </Text>
      {subtitle && <Caption color="tertiary">{subtitle}</Caption>}
    </Stack>
  );
}

interface MetricPillProps {
  t: Theme;
  iconStart: IconRenderer;
  label: string;
  value: string;
}

function MetricPill({ t, iconStart: IconComponent, label, value }: MetricPillProps) {
  return (
    <Row
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: colors.bg[t].subtle,
        borderWidth: 1,
        borderColor: colors.border[t].subtle,
      }}
      gap={6}
      align="center"
    >
      <IconComponent size={14} color={colors.text[t].tertiary} />
      <Text size="sm" weight="semibold">
        {value}
      </Text>
      <Caption color="tertiary">{label}</Caption>
    </Row>
  );
}

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  hasMore: boolean;
  isFetching: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function PaginationFooter({
  page,
  totalPages,
  hasMore,
  isFetching,
  onPrev,
  onNext,
}: PaginationFooterProps) {
  return (
    <Row justify="space-between" align="center" gap={12}>
      <Caption color="secondary">
        Page {page + 1} of {totalPages}
      </Caption>
      <Row gap={8}>
        <Button
          size="sm"
          variant="outline"
          iconStart={ChevronLeft}
          disabled={page === 0 || isFetching}
          onPress={onPrev}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          iconEnd={ChevronRight}
          disabled={!hasMore || isFetching}
          onPress={onNext}
        >
          Next
        </Button>
      </Row>
    </Row>
  );
}

function SkeletonList() {
  return (
    <Stack gap={12} paddingBottom={24}>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} variant="outlined" padding="lg">
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Stack gap={6}>
                <Skeleton width={180} height={16} shape="text" />
                <Skeleton width={100} height={12} shape="text" />
              </Stack>
              <SkeletonBox width={80} height={24} borderRadius={999} />
            </Row>
            <Row gap={8}>
              <SkeletonBox width={70} height={24} borderRadius={999} />
              <SkeletonBox width={90} height={24} borderRadius={999} />
            </Row>
            <Row gap={8}>
              <SkeletonBox width={90} height={28} borderRadius={999} />
              <SkeletonBox width={110} height={28} borderRadius={999} />
              <SkeletonBox width={90} height={28} borderRadius={999} />
            </Row>
            <SkeletonText lines={2} lastLineWidth="60%" />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

interface EmptyStateProps {
  t: Theme;
  onCreate: () => void;
}

function EmptyState({ t, onCreate }: EmptyStateProps) {
  return (
    <Card variant="outlined" padding="xl">
      <Stack gap={16} align="center" style={{ paddingVertical: 24 }}>
        <Stack
          align="center"
          justify="center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            backgroundColor: colors.bg[t].subtle,
            borderWidth: 1,
            borderColor: colors.border[t].subtle,
          }}
        >
          <ClipboardList size={28} color={colors.text[t].tertiary} />
        </Stack>
        <Stack gap={6} align="center">
          <Heading level={4} weight="semibold">
            No work logs yet
          </Heading>
          <Paragraph size="sm" color="secondary" align="center" style={{ maxWidth: 360 }}>
            Create your first work log to start tracking hours, documenting tasks,
            and collaborating with your team.
          </Paragraph>
        </Stack>
        <Button size="md" iconStart={Plus} onPress={onCreate}>
          Record Work Log
        </Button>
      </Stack>
    </Card>
  );
}

interface FilteredEmptyStateProps {
  t: Theme;
  onClear: () => void;
}

function FilteredEmptyState({ t, onClear }: FilteredEmptyStateProps) {
  return (
    <Card variant="outlined" padding="xl">
      <Stack gap={16} align="center" style={{ paddingVertical: 16 }}>
        <Stack
          align="center"
          justify="center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            backgroundColor: colors.bg[t].subtle,
            borderWidth: 1,
            borderColor: colors.border[t].subtle,
          }}
        >
          <Search size={22} color={colors.text[t].tertiary} />
        </Stack>
        <Stack gap={4} align="center">
          <Heading level={5} weight="semibold">
            No matches
          </Heading>
          <Paragraph size="sm" color="secondary" align="center">
            Try adjusting your search or filters.
          </Paragraph>
        </Stack>
        <Button size="sm" variant="outline" onPress={onClear}>
          Clear filters
        </Button>
      </Stack>
    </Card>
  );
}
