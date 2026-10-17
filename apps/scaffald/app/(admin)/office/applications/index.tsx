import { OfficeApplicationsScreen } from '@scf/core/features/office/applications/office-applications-screen'
import { useLocalSearchParams } from 'expo-router'

export default function OfficeApplicationsRoute() {
  // `?job=<id>` opens the pipeline filtered to one posting — My Listings'
  // "View applicants" link (#1199).
  const { job } = useLocalSearchParams<{ job?: string }>()
  return <OfficeApplicationsScreen initialJobId={typeof job === 'string' ? job : null} />
}
