import { OfficeLayout } from '@scf/core/components/layouts'
import { JobForm, officeJobToFormData } from '@scf/core/features/office/components/JobForm'
import { useOfficeJob } from '@scf/core/utils/jobs-sdk-hooks'
import { Spinner, Stack } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'

export default function EditJobPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // The office read carries every field the form edits, with the saved skills
  // and certificates named. The public job detail this used carried a handful,
  // so the rest of the form opened blank (#1342).
  const { data: job, isLoading } = useOfficeJob(id || undefined, { enabled: !!id })

  if (!id) {
    return (
      <Stack align="center" justify="center">
        <Stack>Invalid job ID</Stack>
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!job) {
    return (
      <Stack align="center" justify="center">
        <Stack>Job not found</Stack>
      </Stack>
    )
  }

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <JobForm
          // Remount when a different job loads, so the form reseeds.
          key={job.id}
          mode="edit"
          jobId={id}
          initialData={officeJobToFormData(job as unknown as Record<string, unknown>)}
          initialRelations={{ skills: job.skills, certifications: job.certifications }}
        />
      }
    />
  )
}
