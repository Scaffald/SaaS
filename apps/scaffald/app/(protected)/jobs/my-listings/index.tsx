import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { EmployerJobsList } from '@scf/core/features/jobs/EmployerJobsList'
import { Button } from '@scaffald/ui'
import { useRouter } from 'expo-router'

/**
 * The employer's Jobs screen (#835).
 *
 * Clay, 2026-09-17: "`/jobs/my-listings` is the employer's Jobs screen;
 * `/office/cms/jobs` stays admin-only. Multiple routes for the same data are
 * fine where RBAC roles need different access; the employer nav should show
 * one."
 */
export default function MyListingsRoute() {
  const router = useRouter()

  return (
    <DashboardPage
      screenKicker="Employer view — your postings"
      screenTip="Every posting your organisation has, live or not, with how many people have applied — open a count to see them in the pipeline."
      screenActions={
        // Outline, as in the prototype (#1199): the screen's subject is the
        // postings, and a filled primary out-shouted every row under it.
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
        >
          Post a job
        </Button>
      }
      leftContent={<EmployerJobsList />}
    />
  )
}
