import { ROUTES } from '@scf/core/constants/routes'
import { Redirect } from 'expo-router'

// No page of its own: lands on the tab's first page.
export default function AdminLanding() {
  return <Redirect href={ROUTES.ADMIN.GENERAL.GEOGRAPHIC.path} />
}
