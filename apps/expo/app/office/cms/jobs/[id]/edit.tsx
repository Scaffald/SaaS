import { JobForm } from '@app/core/features/office/components/JobForm'
import { api } from '@app/core/utils/api'
import { Spinner, YStack } from '@scaffald/neue-ui'
import { useLocalSearchParams } from 'expo-router'

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

  const job = data.job as Record<string, unknown>

  return (
    <JobForm
      mode="edit"
      jobId={id}
      initialData={{
        title: (job.title as string) || '',
        description: (job.description as string) || '',
        organization_id: job.organization_id as string,
        assigned_team_id: (job.assigned_team_id as string | null) || null,
        primary_team_id: (job.primary_team_id as string | null) || null,
        team_ids: (job.team_ids as string[]) || [],
        employment_type: (job.employment_type as string) || undefined,
        remote_option: (job.remote_option as string) || undefined,
        location: (job.location as string) || undefined,
        pay_range_min_cents: (job.pay_range_min_cents as number) || undefined,
        pay_range_max_cents: (job.pay_range_max_cents as number) || undefined,
        pay_range_type: (job.pay_range_type as string) || undefined,
        position_level: (job.position_level as string) || undefined,
      }}
    />
  )
}
