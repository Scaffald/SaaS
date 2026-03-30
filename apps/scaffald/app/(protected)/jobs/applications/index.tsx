import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ApplicationsList } from '@scf/core/features/applications/components/ApplicationsList'

export default function DashboardApplicationsListRoute() {
  const breadcrumbs = [{ route: ROUTES.JOBS }, { route: ROUTES.JOBS.APPLICATIONS }]

  return <DashboardPage breadcrumbs={breadcrumbs} leftContent={<ApplicationsList />} />
}
