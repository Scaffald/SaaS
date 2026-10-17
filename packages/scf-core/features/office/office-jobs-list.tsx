import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOfficeListJobs,
  useOfficeDuplicateJobMutation,
  useOfficeUpdateJobMutation,
} from '@scf/core/utils/jobs-sdk-hooks'
import { useTeams } from '@scf/core/utils/teams-sdk-hooks'
import { useOfficeOrganizations } from '@scf/core/utils/office-organizations-sdk-hooks'
import { StatusBadge } from '@scf/core/components/ui'
import {
  Button,
  ResponsiveSelect,
  SegmentedControl,
  TableColumnVisibilityModal,
  Toggle,
  Text,
  Row,
  useThemeContext,
  useToast,
  type TableColumnVisibilityOption,
} from '@scaffald/ui'
import { type ColumnDef, createColumnHelper, type VisibilityState } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import type { OfficeJob } from '@scaffald/sdk'
import { JobsKanbanBoard } from './components/JobsKanbanBoard'
import { OfficePageLayout } from './components/OfficePageLayout'
import { CellText, type CmsRowAction } from './components/CmsCells'
import {
  badgeVariantForTone,
  employmentTypeLabel,
  formatCellDate,
  formatPayRange,
} from './cms-format'
import { listingStatus } from '../jobs/employer-jobs-status'
import { colors } from '@scaffald/ui/tokens'

/**
 * `job_category` is the job form's "Category" — the trade. The api selects it
 * for this list (#1204); the SDK's OfficeJob type does not list it yet.
 */
type Job = OfficeJob & { job_category?: string | null }

const columnHelper = createColumnHelper<Job>()
type JobTeamAssignment = NonNullable<Job['teamAssignments']>[number]

function teamLabel(job: Job): string {
  const assignments = job.teamAssignments ?? []
  if (assignments.length === 0) {
    return job.team?.name ?? 'Unassigned'
  }
  return assignments
    .map((assignment: JobTeamAssignment) => {
      const name = assignment.team?.name ?? 'Untitled team'
      return assignment.isPrimary ? `${name} (Primary)` : name
    })
    .join(', ')
}

// The prototype's columns (admin-admJobs): Role, Employer, Trade, Location,
// Type, Pay, Status, and a ⋯ on every row. Every text cell is one line —
// titles and organization names wrapped to three and set the row height
// (#1204).
const createColumns = () => [
  columnHelper.accessor('title', {
    header: 'Role',
    cell: (info) => <CellText strong>{info.getValue()}</CellText>,
    meta: { label: 'Role', hideable: false },
  }),
  columnHelper.accessor('organization', {
    id: 'organization',
    header: 'Employer',
    cell: (info) => <CellText>{info.getValue()?.name}</CellText>,
    meta: { label: 'Employer' },
  }),
  columnHelper.display({
    id: 'trade',
    header: 'Trade',
    cell: (info) => <CellText>{info.row.original.job_category}</CellText>,
    meta: { width: 112, label: 'Trade' },
  }),
  columnHelper.accessor('location', {
    header: 'Location',
    cell: (info) => (
      <CellText>
        {info.getValue() || (info.row.original.remote_option === 'remote' ? 'Remote' : null)}
      </CellText>
    ),
    meta: { width: 150, label: 'Location' },
  }),
  columnHelper.display({
    id: 'type',
    header: 'Type',
    cell: (info) => <CellText>{employmentTypeLabel(info.row.original.employment_type)}</CellText>,
    meta: { width: 100, label: 'Type' },
  }),
  columnHelper.display({
    id: 'pay',
    header: 'Pay',
    cell: (info) => {
      const job = info.row.original
      return (
        <CellText tabular>
          {formatPayRange(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type)}
        </CellText>
      )
    },
    meta: { width: 136, label: 'Pay' },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    // The vocabulary the employer's own listings use, in the shared tag —
    // this was capitalised plain text ("Open").
    cell: (info) => {
      const status = listingStatus(info.getValue())
      return <StatusBadge variant={badgeVariantForTone(status.tone)}>{status.label}</StatusBadge>
    },
    meta: { width: 88, label: 'Status' },
  }),
  columnHelper.display({
    id: 'team',
    header: 'Team',
    cell: (info) => <CellText>{teamLabel(info.row.original)}</CellText>,
    meta: { label: 'Team' },
  }),
  columnHelper.accessor('created_at', {
    id: 'created_at',
    header: 'Created',
    cell: (info) => <CellText tabular>{formatCellDate(info.getValue())}</CellText>,
    meta: { label: 'Created' },
  }),
]

/**
 * Team said "Unassigned" on most rows and took the width Trade and Type
 * needed; Created is not in the prototype. Both stay one tap away in Columns.
 */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  team: false,
  created_at: false,
}

export interface OfficeJobsListProps {
  showHeader?: boolean
}

type SortOption =
  | 'created_desc'
  | 'created_asc'
  | 'title_asc'
  | 'title_desc'
  | 'status_asc'
  | 'status_desc'

export function OfficeJobsList({ showHeader = true }: OfficeJobsListProps = {}) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [myTeamsOnly, setMyTeamsOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('created_desc')
  const [columnModalOpen, setColumnModalOpen] = useState(false)
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)

  const { data: teamsData, isLoading: teamsLoading } = useTeams({
    includeArchived: false,
  })
  const teams = (teamsData?.teams ?? []) as Array<{
    id: string
    name: string | null
  }>

  const { data: organizationsData } = useOfficeOrganizations()

  const { data, isLoading, error, refetch } = useOfficeListJobs({
    limit: 100,
    offset: 0,
    team_id: teamFilter ?? undefined,
    myTeamsOnly,
    status: statusFilter ? (statusFilter as 'draft' | 'open' | 'paused' | 'closed') : undefined,
  })

  const duplicateMutation = useOfficeDuplicateJobMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const updateMutation = useOfficeUpdateJobMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const jobs = (data?.jobs ?? []) as Job[]
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs

    // Apply search filter
    const query = search.trim().toLowerCase()
    if (query) {
      filtered = filtered.filter((job: Job) => {
        const teamNames = job.teamAssignments?.map(
          (assignment: JobTeamAssignment) => assignment.team?.name ?? ''
        ) ?? [job.team?.name ?? '']
        const organizationName = job.organization?.name ?? ''

        return (
          job.title.toLowerCase().includes(query) ||
          teamNames.some((name) => name.toLowerCase().includes(query)) ||
          organizationName.toLowerCase().includes(query) ||
          (job.location ?? '').toLowerCase().includes(query) ||
          (job.job_category ?? '').toLowerCase().includes(query)
        )
      })
    }

    // Apply organization filter
    if (organizationFilter) {
      filtered = filtered.filter((job: Job) => job.organization?.id === organizationFilter)
    }

    // Apply sorting
    const sorted = [...filtered].sort((a: Job, b: Job) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title_asc':
          return a.title.localeCompare(b.title)
        case 'title_desc':
          return b.title.localeCompare(a.title)
        case 'status_asc':
          return a.status.localeCompare(b.status)
        case 'status_desc':
          return b.status.localeCompare(a.status)
        default:
          return 0
      }
    })

    return sorted
  }, [jobs, search, organizationFilter, sortBy])

  const teamFilterSelectValue = teamFilter ?? 'all'
  const teamFilterPlaceholder = teamsLoading ? 'Loading teams...' : 'All teams'

  const columns = useMemo(() => createColumns(), [])

  const columnVisibilityOptions = useMemo<TableColumnVisibilityOption[]>(
    () =>
      columns.flatMap((column) => {
        const meta = column.meta as { label?: string; hideable?: boolean } | undefined
        const id = column.id ?? (column as { accessorKey?: string }).accessorKey
        if (!id || meta?.hideable === false) return []
        return [{ id: String(id), label: meta?.label ?? String(id) }]
      }),
    [columns]
  )

  const handleRowEdit = (job: Job) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
  }

  const setJobStatus = async (job: Job, status: 'open' | 'paused') => {
    try {
      await updateMutation.mutateAsync({ id: job.id, params: { status } })
      toast.show({
        message:
          status === 'paused'
            ? `${job.title} is paused — hidden from the board, applicants kept.`
            : `${job.title} is live again.`,
        variant: 'success',
      })
    } catch {
      toast.show({
        message: `Couldn’t update ${job.title}. Try again.`,
        variant: 'error',
      })
    }
  }

  const duplicateJob = async (job: Job) => {
    try {
      await duplicateMutation.mutateAsync(job.id)
      toast.show({ message: `Copied ${job.title} as a draft.`, variant: 'success' })
    } catch {
      toast.show({
        message: `Couldn’t copy ${job.title}. Try again.`,
        variant: 'error',
      })
    }
  }

  // The ⋯ on every row (#1204): the prototype's pause / edit / view. View
  // only for a posting the board actually shows; a draft has no public page.
  const rowActions = (job: Job): CmsRowAction[] => {
    const live = job.status === 'open' || job.status === 'published'
    const actions: CmsRowAction[] = [{ label: 'Edit', onPress: () => handleRowEdit(job) }]
    if (live) {
      actions.push({
        label: 'View posting',
        onPress: () => router.push(buildPath(ROUTES.JOBS.DETAIL, { id: job.id })),
      })
      actions.push({
        label: 'Pause',
        onPress: () => void setJobStatus(job, 'paused'),
        disabled: updateMutation.isPending,
      })
    } else if (job.status === 'paused') {
      actions.push({
        label: 'Resume',
        onPress: () => void setJobStatus(job, 'open'),
        disabled: updateMutation.isPending,
      })
    }
    actions.push({
      label: 'Duplicate',
      onPress: () => void duplicateJob(job),
      disabled: duplicateMutation.isPending,
    })
    return actions
  }

  const getItemName = (job: Job) => job.title

  const filtersAccessory = (
    <Row gap={12} align="center" wrap>
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Status</Text>
        <ResponsiveSelect
          value={statusFilter ?? 'all'}
          onValueChange={(value: string) => setStatusFilter(value === 'all' ? null : value)}
          placeholder="All statuses"
          size="sm"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'open', label: 'Live' },
            { value: 'paused', label: 'Paused' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </Row>
      {organizationsData?.organizations && organizationsData.organizations.length > 0 && (
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Organization</Text>
          <ResponsiveSelect
            value={organizationFilter ?? 'all'}
            onValueChange={(value: string) => setOrganizationFilter(value === 'all' ? null : value)}
            placeholder="All organizations"
            size="sm"
            options={[
              { value: 'all', label: 'All organizations' },
              ...organizationsData.organizations.map(
                (org: (typeof organizationsData.organizations)[0]) => ({
                  value: org.id,
                  label: org.name,
                })
              ),
            ]}
          />
        </Row>
      )}
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Team</Text>
        <ResponsiveSelect
          value={teamFilterSelectValue}
          onValueChange={(value: string) => setTeamFilter(value === 'all' ? null : value)}
          placeholder={teamFilterPlaceholder}
          size="sm"
          disabled={teamsLoading}
          options={[
            { value: 'all', label: 'All teams' },
            ...teams.map((team) => ({
              value: team.id,
              label: team.name ?? 'Untitled Team',
            })),
          ]}
        />
      </Row>
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>My teams only</Text>
        <Toggle size="sm" checked={myTeamsOnly} onChange={setMyTeamsOnly} />
      </Row>
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Sort</Text>
        <ResponsiveSelect
          value={sortBy}
          onValueChange={(value: string) => setSortBy(value as SortOption)}
          placeholder="Sort by"
          size="sm"
          options={[
            { value: 'created_desc', label: 'Newest first' },
            { value: 'created_asc', label: 'Oldest first' },
            { value: 'title_asc', label: 'Title A-Z' },
            { value: 'title_desc', label: 'Title Z-A' },
            { value: 'status_asc', label: 'Status A-Z' },
            { value: 'status_desc', label: 'Status Z-A' },
          ]}
        />
      </Row>
    </Row>
  )

  // Inline in the search row, shared by both views — a view toggle is part
  // of the control band, not a line of its own.
  const toolbarActions = (
    <Row gap={8} align="center">
      <SegmentedControl
        // "Board", not "Kanban": it is the prototype's word for this view and
        // it fits the segment without truncating to "Kan…".
        segments={['List', 'Board']}
        selectedIndex={viewMode === 'kanban' ? 1 : 0}
        onSelectionChange={(index: number) => setViewMode(index === 1 ? 'kanban' : 'list')}
        // The toolbar's action slot shrinks to whatever the search row
        // leaves, and the control clipped its own labels to "Kan…" /
        // "Boar…" without a floor.
        style={{ minWidth: 148 }}
      />
      {viewMode === 'list' && (
        <Button size="sm" variant="outline" onPress={() => setColumnModalOpen(true)}>
          Columns
        </Button>
      )}
    </Row>
  )

  // One page for both views (#1205): the board used to draw its own header
  // with a second Create and Kanban / List buttons; now it swaps only the
  // table, under the same header and toolbar.
  return (
    <OfficePageLayout
      resultNoun="job"
      wrapWithOfficeLayout
      kicker="Content management"
      title="Jobs"
      tip="Pausing a posting hides it from the board but keeps its applicant record intact."
      searchPlaceholder="Search jobs — role, employer, city…"
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create job"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
      columns={columns as ColumnDef<Job, unknown>[]}
      data={filteredAndSortedJobs}
      isLoading={isLoading}
      loadError={
        error ? { error, retry: () => void refetch(), title: 'Couldn’t load jobs' } : undefined
      }
      pageSize={50}
      emptyMessage="No jobs found"
      hideHeader={!showHeader}
      onRowEdit={handleRowEdit}
      rowActions={rowActions}
      getItemName={getItemName}
      itemType="job"
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      filterContent={filtersAccessory}
      activeFilterCount={
        (statusFilter ? 1 : 0) +
        (organizationFilter ? 1 : 0) +
        (teamFilter ? 1 : 0) +
        (myTeamsOnly ? 1 : 0)
      }
      toolbarActions={toolbarActions}
      toolbarModals={
        <TableColumnVisibilityModal
          open={columnModalOpen}
          onOpenChange={setColumnModalOpen}
          columns={columnVisibilityOptions}
          visibility={columnVisibility}
          onVisibilityChange={(columnId, visible) =>
            setColumnVisibility((previous) => ({
              ...previous,
              [columnId]: visible,
            }))
          }
        />
      }
      body={
        viewMode === 'kanban' ? (
          <JobsKanbanBoard
            jobs={filteredAndSortedJobs as Parameters<typeof JobsKanbanBoard>[0]['jobs']}
            onJobUpdate={() => refetch()}
          />
        ) : undefined
      }
      // No Quick Actions rail (#1099): it repeated the toolbar's Create and a
      // Refresh, and cost the table ~400px, clipping its last column at 1440.
    />
  )
}
