import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Adapt, Button, Select, Sheet, Switch, Text, XStack } from 'tamagui'
import { Check, ChevronDown, Pencil } from '@tamagui/lucide-icons'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'

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

const formatPayRange = (job: Job) => {
  if (!job.pay_range_min_cents || !job.pay_range_max_cents) {
    return '-'
  }
  const min = (job.pay_range_min_cents / 100).toFixed(0)
  const max = (job.pay_range_max_cents / 100).toFixed(0)
  const type = job.pay_range_type || 'hourly'
  return `$${min}-$${max} ${type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''}`
}

const createColumns = (
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => Promise<void>
) => [
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
    cell: (info) => info.row.original.team?.name ?? 'Unassigned',
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
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const job = info.row.original
      return (
        <XStack gap="$2">
          <Button
            data-testid={`job-edit-button-${job.id}`}
            size="$2"
            variant="outlined"
            icon={Pencil}
            onPress={() => router.push(RouteBuilder.officeJobsEdit(job.id))}
          >
            Edit
          </Button>
          <DeleteButton data-testid={`job-delete-button-${job.id}`} itemName={job.title} itemType="job" onDelete={() => onDelete(job.id)} />
        </XStack>
      )
    },
  }),
]

export function OfficeJobsList() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [myTeamsOnly, setMyTeamsOnly] = useState(false)

  const { data: teamsData, isLoading: teamsLoading } = api.teams.list.useQuery({
    includeArchived: false,
  })
  const teams = (teamsData?.teams ?? []) as Array<{ id: string; name: string | null }>

  const { data, isLoading, refetch } = api.office.listJobs.useQuery({
    limit: 50,
    offset: 0,
    team_id: teamFilter ?? undefined,
    myTeamsOnly,
  })

  const deleteMutation = api.office.deleteJob.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }

  const jobs = data?.jobs ?? []
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return jobs
    }

    return jobs.filter((job: Job) => {
      const teamName = job.team?.name ?? ''
      const organizationName = job.organization?.name ?? ''

      return (
        job.title.toLowerCase().includes(query) ||
        teamName.toLowerCase().includes(query) ||
        organizationName.toLowerCase().includes(query)
      )
    })
  }, [jobs, search])

  const teamFilterSelectValue = teamFilter ?? 'all'
  const teamFilterPlaceholder = teamsLoading ? 'Loading teams...' : 'All teams'

  const columns = createColumns(router, handleDelete)

  const filtersAccessory = (
    <XStack gap="$3" items="center">
      <XStack gap="$2" items="center">
        <Text fontSize="$2" color="$color11">
          Team
        </Text>
        <Select
          value={teamFilterSelectValue}
          onValueChange={(value: string) => setTeamFilter(value === 'all' ? null : value)}
        >
          <Select.Trigger iconAfter={ChevronDown} disabled={teamsLoading}>
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
    </XStack>
  )

  return (
    <OfficePageLayout
      title="Jobs"
      searchPlaceholder="Search jobs..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create Job"
      onCreateClick={() => router.push(ROUTES.OFFICE_JOBS_CREATE.path)}
      columns={columns as ColumnDef<Job, unknown>[]}
      data={filteredJobs}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No jobs found"
      actionBarConfig={{
        bar: {
          addLabel: 'Create Job',
          onAddPress: () => router.push(ROUTES.OFFICE_JOBS_CREATE.path),
          showDisabled: true,
          searchValue: search,
          onSearchChange: setSearch,
          searchPlaceholder: 'Search jobs...',
          rightAccessory: filtersAccessory,
        },
      }}
    />
  )
}
