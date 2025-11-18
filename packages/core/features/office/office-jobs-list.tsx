import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Adapt, Button, Select, Sheet, Switch, Text, XStack, YStack, H2 } from 'tamagui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
import { DashboardLayout } from '@app/ui'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'
import { JobsKanbanBoard } from './components/JobsKanbanBoard'

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

type SortOption = 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc' | 'status_asc' | 'status_desc'

export function OfficeJobsList({ showHeader = true }: OfficeJobsListProps = {}) {
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

  const { data, isLoading, refetch } = api.office.listJobs.useQuery({
    limit: 100, // Increased to support better filtering
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
    router.push(RouteBuilder.officeJobsEdit(job.id))
  }
  
  const handleRowDelete = async (job: Job) => {
    await handleDelete(job.id)
  }

  const handleRowDuplicate = async (job: Job) => {
    await handleDuplicate(job.id)
  }
  
  const getItemName = (job: Job) => job.title

  const filtersAccessory = (
    <XStack gap="$3" items="center" flexWrap="wrap">
      <XStack gap="$2" items="center">
        <Text fontSize="$2" color="$color11">
          Status
        </Text>
        <Select
          value={statusFilter ?? 'all'}
          onValueChange={(value: string) => setStatusFilter(value === 'all' ? null : value)}
        >
          <Select.Trigger iconAfter={ChevronDown} size="$2">
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>
          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Status</Select.Label>
                <Select.Item value="all" index={0}>
                  <Select.ItemText>All statuses</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="draft" index={1}>
                  <Select.ItemText>Draft</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="open" index={2}>
                  <Select.ItemText>Open</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="paused" index={3}>
                  <Select.ItemText>Paused</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="closed" index={4}>
                  <Select.ItemText>Closed</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </XStack>
      {organizationsData?.organizations && organizationsData.organizations.length > 0 && (
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color11">
            Organization
          </Text>
          <Select
            value={organizationFilter ?? 'all'}
            onValueChange={(value: string) => setOrganizationFilter(value === 'all' ? null : value)}
          >
            <Select.Trigger iconAfter={ChevronDown} size="$2">
              <Select.Value placeholder="All organizations" />
            </Select.Trigger>
            <Adapt when="sm" platform="touch">
              <Sheet modal dismissOnSnapToBottom>
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>
            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Organizations</Select.Label>
                  <Select.Item value="all" index={0}>
                    <Select.ItemText>All organizations</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                  {organizationsData.organizations.map((org: typeof organizationsData.organizations[0], index: number) => (
                    <Select.Item key={org.id} value={org.id} index={index + 1}>
                      <Select.ItemText>{org.name}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </XStack>
      )}
      <XStack gap="$2" items="center">
        <Text fontSize="$2" color="$color11">
          Team
        </Text>
        <Select
          value={teamFilterSelectValue}
          onValueChange={(value: string) => setTeamFilter(value === 'all' ? null : value)}
        >
          <Select.Trigger iconAfter={ChevronDown} disabled={teamsLoading} size="$2">
            <Select.Value placeholder={teamFilterPlaceholder} />
          </Select.Trigger>
          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>
          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Teams</Select.Label>
                <Select.Item value="all" index={0}>
                  <Select.ItemText>All teams</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                {teams.map((team, index) => (
                  <Select.Item key={team.id} value={team.id} index={index + 1}>
                    <Select.ItemText>{team.name ?? 'Untitled Team'}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </XStack>
      <XStack gap="$2" items="center">
        <Text fontSize="$2" color="$color11">
          My teams only
        </Text>
        <Switch size="$2" checked={myTeamsOnly} onCheckedChange={setMyTeamsOnly}>
          <Switch.Thumb />
        </Switch>
      </XStack>
      <XStack gap="$2" items="center">
        <Text fontSize="$2" color="$color11">
          Sort
        </Text>
        <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as SortOption)}>
          <Select.Trigger iconAfter={ChevronDown} size="$2">
            <Select.Value>
              {sortBy === 'created_desc' && 'Newest first'}
              {sortBy === 'created_asc' && 'Oldest first'}
              {sortBy === 'title_asc' && 'Title A-Z'}
              {sortBy === 'title_desc' && 'Title Z-A'}
              {sortBy === 'status_asc' && 'Status A-Z'}
              {sortBy === 'status_desc' && 'Status Z-A'}
            </Select.Value>
          </Select.Trigger>
          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>
          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Sort by</Select.Label>
                <Select.Item value="created_desc" index={0}>
                  <Select.ItemText>Newest first</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="created_asc" index={1}>
                  <Select.ItemText>Oldest first</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="title_asc" index={2}>
                  <Select.ItemText>Title A-Z</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="title_desc" index={3}>
                  <Select.ItemText>Title Z-A</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="status_asc" index={4}>
                  <Select.ItemText>Status A-Z</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="status_desc" index={5}>
                  <Select.ItemText>Status Z-A</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </XStack>
    </XStack>
  )

  // Kanban view
  if (viewMode === 'kanban') {
    return (
      <YStack flex={1} bg="$background">
        {showHeader && (
          <YStack p="$4" pb="$3" gap="$3">
            <XStack justify="space-between" items="center">
              <YStack>
                <H2>Jobs</H2>
                <Text color="$color11" fontSize="$3">
                  {filteredAndSortedJobs.length} total jobs
                </Text>
              </YStack>
            <XStack gap="$2">
              <Button
                size="$3"
                onPress={() => setViewMode('kanban')}
                variant="outlined"
              >
                Kanban
              </Button>
              <Button
                size="$3"
                onPress={() => setViewMode('list')}
              >
                List
              </Button>
              <Button
                size="$3"
                onPress={() => router.push(ROUTES.OFFICE_CMS_JOBS_CREATE.path)}
              >
                Create Job
              </Button>
            </XStack>
            </XStack>
            {/* Filters for Kanban view */}
            <XStack gap="$2" items="center" flexWrap="wrap">
              {filtersAccessory}
            </XStack>
          </YStack>
        )}
        <YStack flex={1}>
          <JobsKanbanBoard jobs={filteredAndSortedJobs} onJobUpdate={() => refetch()} />
        </YStack>
      </YStack>
    )
  }

  // List view
  return (
    <DashboardLayout
      leftContent={
        <OfficePageLayout
          title="Jobs"
          searchPlaceholder="Search jobs..."
          searchValue={search}
          onSearchChange={setSearch}
          createButtonLabel="Create Job"
          onCreateClick={() => router.push(ROUTES.OFFICE_CMS_JOBS_CREATE.path)}
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
              onAddPress: () => router.push(ROUTES.OFFICE_CMS_JOBS_CREATE.path),
              showDisabled: true,
              searchValue: search,
              onSearchChange: setSearch,
              searchPlaceholder: 'Search jobs...',
              rightAccessory: (
                <XStack gap="$2" items="center">
                  {filtersAccessory}
                  <Button
                    size="$2"
                    onPress={() => setViewMode('kanban')}
                    variant="outlined"
                  >
                    Kanban
                  </Button>
                  <Button
                    size="$2"
                    onPress={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </XStack>
              ),
            },
          }}
        />
      }
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="Job"
          onCreate={() => router.push(ROUTES.OFFICE_CMS_JOBS_CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
    />
  )
}
