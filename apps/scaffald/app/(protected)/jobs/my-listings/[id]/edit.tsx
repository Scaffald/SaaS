import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { EmployerJobForm } from '@scf/core/features/jobs/EmployerJobForm'
import { useLocalSearchParams } from 'expo-router'

/** The employer edits one of their postings (#1351). */
export default function MyListingsEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DashboardPage leftContent={<EmployerJobForm mode="edit" jobId={id} />} />
}
