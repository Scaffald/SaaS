import { ROUTES } from '@scf/core/constants/routes'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import {
  useAdminAccessLog,
  useAdminChecks,
  useAdminDisputes,
  useAdminMetrics,
} from '@scf/core/utils/background-checks-sdk-hooks'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import type { AdminCheckSummary, AdminDisputeSummary } from '@scaffald/sdk'
import { AlertTriangle, ClipboardList, RefreshCcw } from 'lucide-react-native'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ResponsiveSelect } from '@scaffald/ui'
import {
  Button,
  MetricBlock,
  MetricRow,
  Spinner,
  Tabs,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { computeQueueMetrics } from '../check-sla'
import { colors } from '@scaffald/ui/tokens'

import {
  BACKGROUND_CHECK_STATUSES,
  type BackgroundCheckStatus,
  getStatusMetadata,
} from '../components/status.utils'
import { AdminAuditLogPanel } from './AdminAuditLogPanel'
import { AdminCatalogManager } from './AdminCatalogManager'
import { AdminCheckReviewDialog } from './AdminCheckReviewDialog'
import { AdminDisputeResolutionDialog } from './AdminDisputeResolutionDialog'
import { AdminMetricsPanel } from './AdminMetricsPanel'

type AdminTab = 'checks' | 'disputes' | 'metrics' | 'audit' | 'catalog'

interface CheckRow {
  id: string
  workerName: string
  workerEmail: string | null
  organizationName: string | null
  status: BackgroundCheckStatus
  statusLabel: string
  packageName: string
  completedAt: string | null
  expiresAt: string | null
  invitedAt: string | null
  raw: AdminCheckSummary
}

interface DisputeRow {
  id: string
  workerName: string
  workerEmail: string | null
  organizationName: string | null
  status: string
  filedAt: string | null
  raw: AdminDisputeSummary
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const deriveWorkerName = (record: {
  display_name?: string | null
  username?: string | null
  id?: string | null
}) => {
  if (record.display_name?.trim()) return record.display_name.trim()
  if (record.username?.trim()) return record.username.trim()
  if (record.id) return `User ${record.id.slice(0, 8)}`
  return 'Worker'
}

const STATUS_FILTERS: Array<{ value: 'all' | BackgroundCheckStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...BACKGROUND_CHECK_STATUSES.map((status) => ({
    value: status,
    label: getStatusMetadata(status).label,
  })),
]

export function AdminBackgroundChecksPage() {
  const router = useRouter()
  const { hasRole, isLoading: isLoadingRoles } = useUserRoles()
  const isAdmin = hasRole('background_check_admin')
  const [activeTab, setActiveTab] = useState<AdminTab>('checks')
  const [statusFilter, setStatusFilter] = useState<'all' | BackgroundCheckStatus>('under_review')
  const [searchQuery, setSearchQuery] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [selectedCheck, setSelectedCheck] = useState<AdminCheckSummary | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeSummary | null>(null)

  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const checksQuery = useAdminChecks(
    { status: statusFilter === 'all' ? undefined : statusFilter },
    { enabled: isAdmin, staleTime: 30_000 }
  )

  const disputesQuery = useAdminDisputes(undefined, {
    enabled: isAdmin && activeTab === 'disputes',
    staleTime: 30_000,
  })

  const metricsQuery = useAdminMetrics({
    enabled: isAdmin && activeTab === 'metrics',
    staleTime: 60_000,
  })

  const accessLogQuery = useAdminAccessLog(
    { limit: 200 },
    { enabled: isAdmin && activeTab === 'audit', staleTime: 30_000 }
  )

  type WorkerRecord = {
    display_name?: string | null
    username?: string | null
    email?: string | null
    id?: string | null
  }
  type OrgRecord = { name?: string | null }

  const checkRows = useMemo<CheckRow[]>(() => {
    return (checksQuery.data ?? []).map((check: AdminCheckSummary) => {
      const worker = (check.worker ?? {}) as WorkerRecord
      const organization = (check.organization ?? {}) as OrgRecord
      const statusMeta = getStatusMetadata(check.status as BackgroundCheckStatus)
      return {
        id: check.id,
        workerName: deriveWorkerName(worker),
        workerEmail: worker.email ?? null,
        organizationName: organization.name ?? null,
        status: check.status as BackgroundCheckStatus,
        statusLabel: statusMeta.label,
        packageName: check.package?.display_name ?? check.package?.slug ?? 'Unknown package',
        completedAt: check.completed_at ?? null,
        expiresAt: check.expires_at ?? null,
        invitedAt: check.invited_at ?? null,
        raw: check,
      }
    })
  }, [checksQuery.data])

  const filteredCheckRows = useMemo(() => {
    if (!searchQuery.trim()) return checkRows
    const query = searchQuery.trim().toLowerCase()
    return checkRows.filter((row) => {
      return (
        row.workerName.toLowerCase().includes(query) ||
        (row.workerEmail ?? '').toLowerCase().includes(query) ||
        (row.organizationName ?? '').toLowerCase().includes(query) ||
        row.statusLabel.toLowerCase().includes(query) ||
        row.packageName.toLowerCase().includes(query)
      )
    })
  }, [checkRows, searchQuery])

  const disputeRows = useMemo<DisputeRow[]>(() => {
    return (disputesQuery.data ?? []).map((dispute: AdminDisputeSummary) => {
      const worker = (dispute.background_check?.worker ?? {}) as WorkerRecord
      const organization = (dispute.background_check?.organization ?? {}) as OrgRecord
      return {
        id: dispute.id,
        workerName: deriveWorkerName(worker),
        workerEmail: worker.email ?? null,
        organizationName: organization?.name ?? null,
        status: dispute.status ?? 'unknown',
        filedAt: dispute.created_at ?? null,
        raw: dispute,
      }
    })
  }, [disputesQuery.data])

  const filteredDisputeRows = useMemo(() => {
    if (!searchQuery.trim()) return disputeRows
    const query = searchQuery.trim().toLowerCase()
    return disputeRows.filter((row) => {
      return (
        row.workerName.toLowerCase().includes(query) ||
        (row.workerEmail ?? '').toLowerCase().includes(query) ||
        (row.organizationName ?? '').toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
      )
    })
  }, [disputeRows, searchQuery])

  // biome-ignore lint/correctness/useExhaustiveDependencies: theme-aware colors used in render cells
  const checkColumns: ColumnDef<CheckRow>[] = useMemo(
    () => [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }) => (
          <Stack>
            <Text style={{ color: colors.text[t].secondary }}>{row.original.workerName}</Text>
            {row.original.workerEmail ? (
              <Text style={{ color: colors.text[t].secondary }}>{row.original.workerEmail}</Text>
            ) : null}
          </Stack>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }) => row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'packageName',
        header: 'Package',
        cell: ({ row }) => row.original.packageName,
      },
      {
        accessorKey: 'statusLabel',
        header: 'Status',
        cell: ({ row }) => row.original.statusLabel,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed',
        cell: ({ row }) => formatDateTime(row.original.completedAt),
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expires',
        cell: ({ row }) => formatDateTime(row.original.expiresAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            iconStart={ClipboardList}
            onPress={() => setSelectedCheck(row.original.raw)}
          >
            Review
          </Button>
        ),
      },
    ],
    []
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: theme-aware colors used in render cells
  const disputeColumns: ColumnDef<DisputeRow>[] = useMemo(
    () => [
      {
        accessorKey: 'workerName',
        header: 'Worker',
        cell: ({ row }) => (
          <Stack>
            <Text style={{ color: colors.text[t].secondary }}>{row.original.workerName}</Text>
            {row.original.workerEmail ? (
              <Text style={{ color: colors.text[t].secondary }}>{row.original.workerEmail}</Text>
            ) : null}
          </Stack>
        ),
      },
      {
        accessorKey: 'organizationName',
        header: 'Organization',
        cell: ({ row }) => row.original.organizationName ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status,
      },
      {
        accessorKey: 'filedAt',
        header: 'Filed',
        cell: ({ row }) => formatDateTime(row.original.filedAt),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            iconStart={AlertTriangle}
            onPress={() => setSelectedDispute(row.original.raw)}
          >
            Resolve
          </Button>
        ),
      },
    ],
    []
  )

  const summaryStats = useMemo(() => {
    const total = checksQuery.data?.length ?? 0
    const pendingDisputes =
      disputesQuery.data?.filter(
        (dispute: AdminDisputeSummary) =>
          dispute.status === 'pending' || dispute.status === 'under_review'
      ) ?? []
    // The queue's own numbers: what is open, what is late, and how long a case
    // typically sits. A queue that shows status but not elapsed time tells a
    // processor what a case IS, not which one to pick up.
    const queue = computeQueueMetrics(checksQuery.data ?? [])
    return {
      total,
      pendingDisputes: pendingDisputes.length,
      ...queue,
    }
  }, [checksQuery.data, disputesQuery.data])

  if (isLoadingRoles) {
    return (
      <Stack flex={1} align="center" justify="center" gap={8}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Verifying admin access…</Text>
      </Stack>
    )
  }

  if (!isAdmin) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12} paddingHorizontal={16}>
        <Text style={{ color: colors.text[t].secondary }}>Admin access required</Text>
        <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
          Background check review tools are restricted to compliance administrators. Contact an
          administrator if you believe this is an error.
        </Text>
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(ROUTES.OFFICE.ATS.CHECKS.path)}
        >
          Go to organization background checks
        </Button>
      </Stack>
    )
  }

  return (
    <Stack flex={1} style={{ backgroundColor: colors.bg[t].default }}>
      <Stack padding="md" gap={16}>
        <Stack gap={8}>
          <Text style={{ color: colors.text[t].secondary }}>Background check administration</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Review in-progress screenings, resolve disputes, and keep results compliant.
          </Text>
        </Stack>

        {/* The queue strip. These were three Cards whose label and value used
            the SAME colour and size, so the figure did not read as a figure —
            the "metric labels change position" drift the prototype's audit
            named. One block now: label above, figure below, delta beneath.

            Over SLA and Due today are new. The queue previously showed what a
            case IS (its status) but never how long it had been sitting, which
            is the number that decides what a processor picks up next. */}
        <MetricRow bordered>
          <MetricBlock label="Open cases" value={summaryStats.openCount} />
          <MetricBlock
            label="Over SLA"
            value={summaryStats.overSlaCount}
            emphasis={summaryStats.overSlaCount > 0}
            tone="attention"
            delta={summaryStats.overSlaCount > 0 ? 'needs chasing' : undefined}
          />
          <MetricBlock
            label="Due today"
            value={summaryStats.dueTodayCount}
            tone={summaryStats.dueTodayCount > 0 ? 'attention' : 'neutral'}
          />
          <MetricBlock
            label="Median days open"
            // Null, not 0, when nothing is open — an empty queue has no median,
            // and "0d" would read as "we turn everything around same-day".
            value={summaryStats.medianDaysOpen == null ? '—' : `${summaryStats.medianDaysOpen}d`}
          />
          <MetricBlock label="Pending disputes" value={summaryStats.pendingDisputes} />
          <MetricBlock label="Total in view" value={summaryStats.total} />
        </MetricRow>

        <Row
          gap={12}
          paddingHorizontal={8}
          style={{
            backgroundColor: colors.bg[t].default,
            borderBottomWidth: 1,
            borderBottomColor: colors.border[t].default,
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AdminTab)}
            type="line"
            color="primary"
          >
            <Tabs.Item value="checks">
              <Tabs.Trigger
                containerStyle={{
                  borderBottomWidth: activeTab === 'checks' ? 2 : 0,
                  borderBottomColor: colors.fg[t].default,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                Checks
              </Tabs.Trigger>
            </Tabs.Item>
            <Tabs.Item value="disputes">
              <Tabs.Trigger
                containerStyle={{
                  borderBottomWidth: activeTab === 'disputes' ? 2 : 0,
                  borderBottomColor: colors.fg[t].default,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                Disputes
              </Tabs.Trigger>
            </Tabs.Item>
            <Tabs.Item value="metrics">
              <Tabs.Trigger
                containerStyle={{
                  borderBottomWidth: activeTab === 'metrics' ? 2 : 0,
                  borderBottomColor: colors.fg[t].default,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                Metrics
              </Tabs.Trigger>
            </Tabs.Item>
            <Tabs.Item value="catalog">
              <Tabs.Trigger
                containerStyle={{
                  borderBottomWidth: activeTab === 'catalog' ? 2 : 0,
                  borderBottomColor: colors.fg[t].default,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                Catalog
              </Tabs.Trigger>
            </Tabs.Item>
            <Tabs.Item value="audit">
              <Tabs.Trigger
                containerStyle={{
                  borderBottomWidth: activeTab === 'audit' ? 2 : 0,
                  borderBottomColor: colors.fg[t].default,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                Audit Log
              </Tabs.Trigger>
            </Tabs.Item>
          </Tabs>
        </Row>

        {activeTab === 'checks' ? (
          <Row gap={12} wrap justify="space-between" align="center">
            <Row gap={8} align="center">
              <ResponsiveSelect
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | BackgroundCheckStatus)}
                placeholder="Filter by status"
                options={STATUS_FILTERS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
              <Button
                size="sm"
                variant="outline"
                iconStart={RefreshCcw}
                onPress={() => checksQuery.refetch()}
                disabled={checksQuery.isLoading}
              >
                Refresh
              </Button>
            </Row>
            <Button
              size="sm"
              variant="outline"
              onPress={() => router.push(ROUTES.OFFICE.ATS.CHECKS.path)}
            >
              Organization view
            </Button>
          </Row>
        ) : null}

        {activeTab === 'disputes' ? (
          <Row gap={8}>
            <Button
              size="sm"
              variant="outline"
              iconStart={RefreshCcw}
              onPress={() => disputesQuery.refetch()}
              disabled={disputesQuery.isLoading}
            >
              Refresh disputes
            </Button>
          </Row>
        ) : null}
      </Stack>

      {activeTab === 'checks' ? (
        <OfficePageLayout
          title="Screenings under review"
          searchPlaceholder="Search by worker, organization, or package"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          createButtonLabel="Request background check"
          onCreateClick={() => router.push(ROUTES.OFFICE.ATS.CHECKS.REQUEST.path)}
          hideCreateButton
          data={filteredCheckRows}
          columns={checkColumns}
          isLoading={checksQuery.isLoading}
          emptyMessage={
            checksQuery.isLoading
              ? 'Loading background checks…'
              : 'No background checks found for this filter.'
          }
          onRowView={(row) => setSelectedCheck(row.raw)}
        />
      ) : null}

      {activeTab === 'disputes' ? (
        <OfficePageLayout
          title="Dispute management"
          searchPlaceholder="Search disputes…"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          createButtonLabel="Resolve dispute"
          onCreateClick={() => setActiveTab('disputes')}
          hideCreateButton
          data={filteredDisputeRows}
          columns={disputeColumns}
          isLoading={disputesQuery.isLoading}
          emptyMessage={
            disputesQuery.isLoading
              ? 'Loading disputes…'
              : 'No disputes require attention right now.'
          }
          onRowView={(row) => setSelectedDispute(row.raw)}
        />
      ) : null}

      {activeTab === 'metrics' ? (
        <Stack paddingHorizontal={16} paddingBottom={16}>
          <AdminMetricsPanel
            metrics={metricsQuery.data}
            isLoading={metricsQuery.isLoading}
            onRefresh={() => void metricsQuery.refetch()}
          />
        </Stack>
      ) : null}

      {activeTab === 'catalog' ? (
        <Stack paddingHorizontal={16} paddingBottom={16}>
          <AdminCatalogManager />
        </Stack>
      ) : null}

      {activeTab === 'audit' ? (
        <AdminAuditLogPanel
          entries={accessLogQuery.data ?? []}
          isLoading={accessLogQuery.isLoading}
          searchValue={auditSearch}
          onSearchChange={setAuditSearch}
          onRefresh={() => void accessLogQuery.refetch()}
        />
      ) : null}

      <AdminCheckReviewDialog
        open={Boolean(selectedCheck)}
        check={selectedCheck}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCheck(null)
          }
        }}
        onUpdated={() => setSelectedCheck(null)}
      />

      <AdminDisputeResolutionDialog
        open={Boolean(selectedDispute)}
        dispute={selectedDispute}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDispute(null)
          }
        }}
        onResolved={() => setSelectedDispute(null)}
      />
    </Stack>
  )
}
