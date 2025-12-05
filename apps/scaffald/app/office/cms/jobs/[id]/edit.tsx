import { JobForm } from '@scf/core/features/office/components/JobForm'
import { api } from '@scf/core/utils/api'
import { Spinner, YStack } from '@unicornlove/ui'
import { useLocalSearchParams } from 'expo-router'

export default function EditJobPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <YStack>Invalid job ID</YStack>
      </YStack>
    )
  }

  const { data, isLoading } = api.office.getJob.useQuery({ id }, { enabled: !!id })

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.job) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
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
        assigned_team_id: (job.assigned_team_id as string | null) || null,
        description: (job.description as string) || '',
        employment_type: (job.employment_type as string) || undefined,
        location: (job.location as string) || undefined,
        organization_id: job.organization_id as string,
        pay_range_max_cents: (job.pay_range_max_cents as number) || undefined,
        pay_range_min_cents: (job.pay_range_min_cents as number) || undefined,
        pay_range_type: (job.pay_range_type as string) || undefined,
        position_level: (job.position_level as string) || undefined,
        primary_team_id: (job.primary_team_id as string | null) || null,
        remote_option: (job.remote_option as string) || undefined,
        team_ids: (job.team_ids as string[]) || [],
        title: (job.title as string) || '',
      }}
    />
  )
}
