import { YStack, XStack, Text, Input, DataTable, Button } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Plus } from '@tamagui/lucide-icons'

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

const columns = [
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
]

export function OfficeJobsList() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = api.office.listJobs.useQuery({
    limit: 50,
    offset: 0,
  })

  const jobs = data?.jobs ?? []
  const filteredJobs = jobs.filter((job: Job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <YStack flex={1} bg="$background">
      {/* Header */}
      <XStack p="$4" gap="$4" items="center" borderBottomWidth={1} bg="$borderColor">
        <Text fontSize="$8" fontWeight="bold">
          Jobs
        </Text>
        <Input flex={1} placeholder="Search jobs..." value={search} onChangeText={setSearch} />
        <Button icon={Plus} onPress={() => router.push('/office/jobs/create')} themeInverse>
          Create Job
        </Button>
      </XStack>

      {/* Table */}
      <DataTable
        columns={columns as ColumnDef<unknown, unknown>[]}
        data={filteredJobs}
        isLoading={isLoading}
        onRowClick={(job) => router.push(`/office/jobs/${(job as Job).id}/edit`)}
        pageSize={50}
        emptyMessage="No jobs found"
      />
    </YStack>
  )
}
