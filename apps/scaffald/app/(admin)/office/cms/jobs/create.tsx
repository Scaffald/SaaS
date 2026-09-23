import { OfficeLayout } from '@scf/core/components/layouts'
import { JobForm } from '@scf/core/features/office/components/JobForm'

/**
 * The posting form (#835). It sits in the Office shell like every other
 * admin screen, rather than rendering bare with its own scroll view.
 */
export default function CreateJobPage() {
  return <OfficeLayout showBreadcrumb leftContent={<JobForm mode="create" />} />
}
