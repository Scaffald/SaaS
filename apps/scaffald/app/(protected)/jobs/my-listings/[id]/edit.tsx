import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { EmployerJobForm } from '@scf/core/features/jobs/EmployerJobForm'
import { useLocalSearchParams } from 'expo-router'

/** The employer edits one of their postings (#1351). */
export default function MyListingsEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // The form opens with its own header, which carries the save buttons, so
  // the shell's title would be the page's second (#1436).
  return <DashboardPage hideScreenHeader leftContent={<EmployerJobForm mode="edit" jobId={id} />} />
}
