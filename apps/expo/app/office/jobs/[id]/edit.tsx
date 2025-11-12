import { YStack, Spinner } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@app/core/utils/api'
import { JobForm } from '@app/core/features/office/components/JobForm'

export default function EditJobPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} items="center" justify="center">
        <YStack>Invalid job ID</YStack>
      </YStack>
    )
  }

  const { data, isLoading } = api.office.getJob.useQuery({ id }, { enabled: !!id })

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.job) {
    return (
      <YStack flex={1} items="center" justify="center">
        <YStack>Job not found</YStack>
      </YStack>
    )
  }

  return (
    <JobForm
      mode="edit"
      jobId={id}
      initialData={{
        title: data.job.title,
        description: data.job.description || '',
        organization_id: data.job.organization_id,
        assigned_team_id: data.job.assigned_team_id || null,
        employment_type: data.job.employment_type || undefined,
        remote_option: data.job.remote_option || undefined,
        location: data.job.location || undefined,
        pay_range_min_cents: data.job.pay_range_min_cents || undefined,
        pay_range_max_cents: data.job.pay_range_max_cents || undefined,
        pay_range_type: data.job.pay_range_type || undefined,
        position_level: data.job.position_level || undefined,
      }}
    />
  )
}
