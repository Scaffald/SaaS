import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { EmployerJobForm } from '@scf/core/features/jobs/EmployerJobForm'

/**
 * The employer posts a job (#1351). The same form as the Office CMS, outside
 * the Office shell (which only office staff may open), offering only the
 * organisations this person can hire for.
 */
export default function MyListingsCreateRoute() {
  return <DashboardPage leftContent={<EmployerJobForm mode="create" />} />
}
