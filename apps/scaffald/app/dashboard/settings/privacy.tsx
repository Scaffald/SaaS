import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ROUTES } from '@scf/core/constants/routes'
import { PrivacyDataScreen } from '@scf/core/features/privacy/PrivacyDataScreen'

export default function PrivacySettingsPage() {
  return (
    <DashboardPage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.SETTINGS },
        { label: 'Privacy & Data', href: ROUTES.DASHBOARD.SETTINGS.PRIVACY.path },
      ]}
      pageTitle="Privacy & Data Management"
      leftContent={<PrivacyDataScreen />}
      fullWidth
    />
  )
}
