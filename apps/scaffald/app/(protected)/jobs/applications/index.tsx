import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ApplicationsList } from '@scf/core/features/applications/components/ApplicationsList'

// A folder tab of Jobs, not a drill-in: no trail, so no breadcrumb or back
// link (#1163). Its trail's "Jobs" crumb also led to the public /jobs page.
export default function DashboardApplicationsListRoute() {
  return <DashboardPage leftContent={<ApplicationsList />} />
}
