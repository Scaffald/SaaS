import { api } from '@app/core/utils/api'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Button, XStack } from 'tamagui'
import { Pencil } from '@tamagui/lucide-icons'
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
  organization: {
    id: string
    name: string
    slug: string
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

  const { data, isLoading, refetch } = api.office.listJobs.useQuery({
    limit: 50,
    offset: 0,
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
  const filteredJobs = jobs.filter((job: Job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  )

  const columns = createColumns(router, handleDelete)

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
    />
  )
}
