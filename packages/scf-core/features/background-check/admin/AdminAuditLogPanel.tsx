import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import type { AppRouter } from '@scf/supabase/client-types'
import type { ColumnDef } from '@tanstack/react-table'
import type { inferRouterOutputs } from '@trpc/server'
import { type Dispatch, type SetStateAction, useMemo } from 'react'

type RouterOutputs = inferRouterOutputs<AppRouter>
type AuditLogEntry = RouterOutputs['backgroundChecks']['adminGetAccessLog'][number]

interface AdminAuditLogPanelProps {
  entries: AuditLogEntry[]
  isLoading: boolean
  searchValue: string
  onSearchChange: Dispatch<SetStateAction<string>>
  onRefresh: () => void
}

interface AuditRow {
  id: string
  accessedAt: string | null
  actorName: string
  actorEmail: string | null
  accessType: string
  checkId: string | null
  packageName: string | null
  workerName: string | null
  ipAddress: string | null
  userAgent: string | null
}

const ACCESS_TYPE_LABELS: Record<string, string> = {
  view_results: 'Viewed results',
  download_report: 'Downloaded report',
  share: 'Shared results',
  update_status: 'Updated status',
  update_privacy: 'Changed privacy',
}

export function AdminAuditLogPanel({
  entries,
  isLoading,
  searchValue,
  onSearchChange,
  onRefresh,
}: AdminAuditLogPanelProps) {
  const columns = useMemo<ColumnDef<AuditRow>[]>(() => {
    return [
      {
        header: 'Timestamp',
        accessorKey: 'accessedAt',
        cell: ({ row }) => row.original.accessedAt ?? '—',
      },
      {
        header: 'Actor',
        accessorKey: 'actorName',
        cell: ({ row }) => (
          <>
            {row.original.actorName}
            {row.original.actorEmail ? ` (${row.original.actorEmail})` : ''}
          </>
        ),
      },
      {
        header: 'Action',
        accessorKey: 'accessType',
        cell: ({ row }) => ACCESS_TYPE_LABELS[row.original.accessType] ?? row.original.accessType,
      },
      {
        header: 'Package',
        accessorKey: 'packageName',
        cell: ({ row }) => row.original.packageName ?? '—',
      },
      {
        header: 'Worker',
        accessorKey: 'workerName',
        cell: ({ row }) => row.original.workerName ?? '—',
      },
      {
        header: 'IP Address',
        accessorKey: 'ipAddress',
        cell: ({ row }) => row.original.ipAddress ?? '—',
      },
    ]
  }, [])

  const filteredRows = useMemo<AuditRow[]>(() => {
    const query = searchValue.trim().toLowerCase()
    const baseRows = entries.map<AuditRow>((entry) => ({
      id: entry.id,
      accessedAt: entry.accessed_at ? new Date(entry.accessed_at).toLocaleString() : null,
      actorName: entry.actor?.name ?? 'Unknown actor',
      actorEmail: entry.actor?.email ?? null,
      accessType: entry.access_type ?? 'other',
      checkId: entry.background_check?.id ?? null,
      packageName: entry.background_check?.package_name ?? null,
      workerName: entry.background_check?.worker_name ?? null,
      ipAddress: entry.ip_address ?? null,
      userAgent: entry.user_agent ?? null,
    }))

    if (!query) {
      return baseRows
    }

    return baseRows.filter((row) => {
      return (
        row.actorName.toLowerCase().includes(query) ||
        (row.actorEmail ?? '').toLowerCase().includes(query) ||
        (row.packageName ?? '').toLowerCase().includes(query) ||
        (row.workerName ?? '').toLowerCase().includes(query) ||
        (row.accessType ?? '').toLowerCase().includes(query) ||
        (row.ipAddress ?? '').toLowerCase().includes(query)
      )
    })
  }, [entries, searchValue])

  return (
    <OfficePageLayout<AuditRow>
      title="Access audit log"
      searchPlaceholder="Search by actor, package, worker, or IP address"
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      createButtonLabel="Refresh"
      onCreateClick={onRefresh}
      columns={columns}
      data={filteredRows}
      isLoading={isLoading}
      hideCreateButton={false}
      emptyMessage="No access log entries found for this filter."
    />
  )
}
