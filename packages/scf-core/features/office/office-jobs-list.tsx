import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { api } from '@scf/core/utils/api'
import { OfficeLayout } from '@scf/core/components/layouts'
import { ResponsiveSelect, useThemeContext } from '@scaffald/ui'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, H2, Switch, Text, Row, Stack } from '@scaffald/ui'
import { JobsKanbanBoard } from './components/JobsKanbanBoard'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'
import { colors } from '@scaffald/ui/tokens'

type Job = {
  id: string
  title: string
  description: string | null
  status: string
  employment_type: string | null
  remote_option: string | null
  location: string | null
  pay_range_min_cents: number | null
  pay_range_max_cents: number | null
  pay_range_type: string | null
  posted_at: string | null
  created_at: string
  updated_at: string
  assigned_team_id: string | null
  team_ids?: string[]
  primary_team_id?: string | null
  teamAssignments?: Array<{
    teamId: string
    isPrimary: boolean
    team?: {
      id?: string
      name?: string | null
      organization_id?: string | null
    } | null
  }>
  organization: {
    id: string
    name: string
    slug: string
  } | null
  team: {
    id: string
    name: string | null
    organization_id?: string | null
  } | null
  created_by: {
    id: string
    username: string | null
    display_name: string | null
  } | null
}

const columnHelper = createColumnHelper<Job>()
type JobTeamAssignment = NonNullable<Job['teamAssignments']>[number]

const formatPayRange = (job: Job) => {
  if (!job.pay_range_min_cents || !job.pay_range_max_cents) {
    return '-'
  }
  const min = (job.pay_range_min_cents / 100).toFixed(0)
  const max = (job.pay_range_max_cents / 100).toFixed(0)
  const type = job.pay_range_type || 'hourly'
  return `$${min}-$${max} ${type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''}`
}

const createColumns = (_router: ReturnType<typeof useRouter>) => [
  columnHelper.accessor('title', {
    header: 'Title',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      return status.charAt(0).toUpperCase() + status.slice(1)
    },
  }),
  columnHelper.accessor('organization', {
    header: 'Organization',
    cell: (info) => info.getValue()?.name || '-',
  }),
  columnHelper.display({
    id: 'team',
    header: 'Team',
    cell: (info) => {
      const assignments = info.row.original.teamAssignments ?? []
      if (assignments.length === 0) {
        return info.row.original.team?.name ?? 'Unassigned'
      }
      return assignments
        .map((assignment: JobTeamAssignment) => {
          const name = assignment.team?.name ?? 'Untitled team'
          return assignment.isPrimary ? `${name} (Primary)` : name
        })
        .join(', ')
    },
  }),
  columnHelper.accessor('location', {
    header: 'Location',
    cell: (info) => info.getValue() || 'Remote',
  }),
  columnHelper.display({
    id: 'pay',
    header: 'Pay Range',
    cell: (info) => formatPayRange(info.row.original),
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  // Actions column removed - using RowActionOverlay instead
]

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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [myTeamsOnly, setMyTeamsOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('created_desc')

  const { data: teamsData, isLoading: teamsLoading } = api.teams.list.useQuery({
    includeArchived: false,
  })
  const teams = (teamsData?.teams ?? []) as Array<{ id: string; name: string | null }>

  const { data: organizationsData } = api.office.getOrganizations.useQuery()

  const { data, isLoading, refetch } = useOfficeListJobs({
    limit: 100,
    offset: 0,
    team_id: teamFilter ?? undefined,
    myTeamsOnly,
    status: statusFilter ? (statusFilter as 'draft' | 'open' | 'paused' | 'closed') : undefined,
  })

  const deleteMutation = api.office.deleteJob.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const duplicateMutation = api.office.duplicateJob.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }

  const handleDuplicate = async (id: string) => {
    await duplicateMutation.mutateAsync({ id })
  }

  const jobs = data?.jobs ?? []
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
          organizationName.toLowerCase().includes(query)
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

  const columns = createColumns(router)

  const handleRowEdit = (job: Job) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
  }

  const handleRowDelete = async (job: Job) => {
    await handleDelete(job.id)
  }

  const handleRowDuplicate = async (job: Job) => {
    await handleDuplicate(job.id)
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
            { value: 'open', label: 'Open' },
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
        <Switch size="sm" checked={myTeamsOnly} onChange={setMyTeamsOnly}>
          <Switch.Thumb />
        </Switch>
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

  // Kanban view
  if (viewMode === 'kanban') {
    return (
      <OfficeLayout
        showBreadcrumb
        leftContent={
          <Stack flex={1} style={{ backgroundColor: colors.bg[theme].default }}>
            {showHeader && (
              <Stack padding="md" paddingBottom={12} gap={12}>
                <Row justify="space-between" align="center">
                  <Stack>
                    <H2>Jobs</H2>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {filteredAndSortedJobs.length} total jobs
                    </Text>
                  </Stack>
                  <Row gap={8}>
                    <Button size="sm" onPress={() => setViewMode('kanban')} variant="outline">
                      Kanban
                    </Button>
                    <Button size="sm" onPress={() => setViewMode('list')}>
                      List
                    </Button>
                    <Button
                      size="sm"
                      onPress={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
                    >
                      Create Job
                    </Button>
                  </Row>
                </Row>
                <Row gap={8} align="center" wrap>
                  {filtersAccessory}
                </Row>
              </Stack>
            )}
            <Stack flex={1}>
              <JobsKanbanBoard jobs={filteredAndSortedJobs} onJobUpdate={() => refetch()} />
            </Stack>
          </Stack>
        }
      />
    )
  }

  return (
    <OfficePageLayout
      wrapWithOfficeLayout
      showBreadcrumb
      title="Jobs"
      searchPlaceholder="Search jobs..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create Job"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
      columns={columns as ColumnDef<Job, unknown>[]}
      data={filteredAndSortedJobs}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No jobs found"
      hideHeader={!showHeader}
      onRowEdit={handleRowEdit}
      onRowDelete={handleRowDelete}
      onRowDuplicate={handleRowDuplicate}
      getItemName={getItemName}
      itemType="job"
      actionBarConfig={{
        bar: {
          addLabel: 'Create Job',
          onAddPress: () => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path),
          showDisabled: true,
          searchValue: search,
          onSearchChange: setSearch,
          searchPlaceholder: 'Search jobs...',
          rightAccessory: (
            <Row gap={8} align="center">
              {filtersAccessory}
              <Button size="sm" onPress={() => setViewMode('kanban')} variant="outline">
                Kanban
              </Button>
              <Button size="sm" onPress={() => setViewMode('list')}>
                List
              </Button>
            </Row>
          ),
        },
      }}
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="Job"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
    />
  )
}
