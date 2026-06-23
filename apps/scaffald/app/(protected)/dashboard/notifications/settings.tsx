import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SettingsNotificationsSection } from '@scf/core/features/notifications/SettingsNotificationsSection'

export default function NotificationsSettingsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Notification settings"
      leftContent={<SettingsNotificationsSection />}
    />
  )
}
