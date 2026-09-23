import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { JobApplyScreen, useJobApplyHeader } from '@scf/core/features/applications/job-apply-screen'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useJobDetails } from '@scf/core/utils/jobs-sdk-hooks'
import { useLocalSearchParams } from 'expo-router'

/**
 * Applying to a posting (#829). One column, full width: the form is the
 * screen, not a sidebar inside one.
 */
export default function JobApplyPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: job } = useJobDetails(id, { enabled: !!id })
  const { title, kicker } = useJobApplyHeader(id ?? '')

  if (!id) {
    return null
  }

  return (
    <DashboardPage
      fullWidth
      leftContent={<JobApplyScreen jobId={id} />}
      pageTitle={() => title}
      pageTitleDeps={[title]}
      screenTitle={title}
      screenKicker={kicker}
      breadcrumbItems={[
        { label: 'Home', href: ROUTES.DASHBOARD.path },
        { label: 'Jobs', href: ROUTES.JOBS.path },
        {
          label: job?.title ?? 'Job details',
          href: buildPath(ROUTES.JOBS.DETAIL, { id }),
        },
        { label: 'Apply' },
      ]}
    />
  )
}
