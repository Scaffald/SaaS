import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SettingsNotificationsSection } from '@scf/core/features/notifications/SettingsNotificationsSection'

export default function NotificationsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Notifications"
      leftContent={<SettingsNotificationsSection />}
    />
  )
}
