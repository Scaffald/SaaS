import { LoadFailure } from '@scf/core/components/ui/LoadFailure'
import { ROUTES } from '@scf/core/constants/routes'
import { JobForm, officeJobToFormData } from '@scf/core/features/office/components/JobForm'
import { useOfficeJob } from '@scf/core/utils/jobs-sdk-hooks'
import { canHireFor } from '@scf/core/utils/organization-memberships'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { EmptyState, Spinner, Stack } from '@scaffald/ui'
import { useMemo } from 'react'

type EmployerJobFormProps = { mode: 'create' } | { mode: 'edit'; jobId: string | undefined }

/**
 * The employer's posting form (#1351): the Office CMS JobForm, offering only
 * the organisations this person can hire for (owner or org admin — the api's
 * rule in office-jobs canWriteJobsFor). Before this an employer had no way to
 * post a job: the only form sat behind the Office shell's office-role guard.
 *
 * The 4-step wizard the prototype has is #1215; this is the working form now.
 */
export function EmployerJobForm(props: EmployerJobFormProps) {
  const { data: memberships, isLoading: membershipsLoading, error, refetch } = useOrganizations()
  const editId = props.mode === 'edit' ? props.jobId : undefined
  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
    refetch: refetchJob,
  } = useOfficeJob(editId, { enabled: !!editId })

  const organizations = useMemo(
    () =>
      (memberships ?? [])
        .filter(canHireFor)
        .map((m) => ({ id: m.organization_id, name: m.organization_name })),
    [memberships]
  )

  const back = { label: 'My Listings', href: ROUTES.JOBS.MY_LISTINGS.path }

  if (membershipsLoading || (editId && jobLoading)) {
    return (
      <Stack align="center" justify="center" paddingVertical={48}>
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (error) {
    return <LoadFailure error={error} noun="organizations" retry={() => refetch()} back={back} />
  }

  if (organizations.length === 0) {
    return (
      <EmptyState
        title="No organization to post for"
        description="Only an organization's owner or an admin can post its jobs. Ask your organization's owner to make you an admin."
      />
    )
  }

  if (props.mode === 'edit') {
    if (!editId || jobError || !job) {
      return (
        <LoadFailure
          error={jobError ?? new Error('Job not found')}
          noun="posting"
          retry={jobError ? () => refetchJob() : undefined}
          back={back}
        />
      )
    }
    return (
      <JobForm
        key={job.id}
        mode="edit"
        jobId={editId}
        organizations={organizations}
        initialData={officeJobToFormData(job as unknown as Record<string, unknown>)}
        initialRelations={{ skills: job.skills, certifications: job.certifications }}
        doneHref={ROUTES.JOBS.MY_LISTINGS.path}
      />
    )
  }

  return (
    <JobForm mode="create" organizations={organizations} doneHref={ROUTES.JOBS.MY_LISTINGS.path} />
  )
}
