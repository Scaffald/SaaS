/**
 * Developer App Registration Page
 * Self-service app registration page
 */

import { DashboardLayout } from '@scf/core/components/layouts'
import { AppRegistrationForm } from '@scf/core/features/oauth/components/AppRegistrationForm'

// Inside the app shell (developers/_layout) with the standard gutter. This was
// a bare SafeAreaView, outside the shell on white (#1098). Not OfficeLayout:
// registration is not an Office section, and that layout would draw Office's
// section tabs over it.
export default function DeveloperRegisterPage() {
  return <DashboardLayout leftContent={<AppRegistrationForm />} />
}
