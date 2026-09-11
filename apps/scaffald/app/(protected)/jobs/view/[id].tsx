import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverJobDetailScreen } from '@scf/core/features/discover/discover-job-detail-screen'
import { ROUTES } from '@scf/core/constants/routes'
import { useExternalJobs, useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { useLocalSearchParams } from 'expo-router'

export default function JobDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Same internal→external resolution as DiscoverJobDetailLeft; these hit the
  // shared react-query cache, so no extra requests. Needed here so the header
  // shows the job name instead of "Jobs" and the breadcrumb doesn't read
  // "Home > Jobs > Jobs" (#385).
  const { data: internalJob, isLoading: internalLoading } = useJobDetails(id, {
    enabled: !!id,
  })
  const { data: externalJobsList } = useExternalJobs({
    enabled: !!id && !internalJob && !internalLoading,
  })

  if (!id) {
    return null
  }

  const externalJob = externalJobsList?.find((j: { id: string }) => j.id === id)
  const jobTitle: string | null =
    internalJob?.title ?? externalJob?.title ?? null

  const { left, right } = DiscoverJobDetailScreen({ jobId: id })
  return (
    <DashboardPage
      leftContent={left}
      rightContent={right}
      pageTitle={() => jobTitle}
      pageTitleDeps={[jobTitle]}
      breadcrumbItems={[
        { label: 'Home', href: ROUTES.DASHBOARD.path },
        { label: 'Jobs', href: ROUTES.JOBS.path },
        // While the job is loading, show a neutral crumb instead of "Jobs"
        // twice.
        { label: jobTitle ?? 'Job details' },
      ]}
    />
  )
}
