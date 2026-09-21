import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  NotificationsCenterScreen,
  NotificationsSettingsAction,
} from '@scf/core/features/notifications/NotificationsCenterScreen'

export default function NotificationsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Notifications"
      screenActions={<NotificationsSettingsAction />}
      leftContent={<NotificationsCenterScreen />}
    />
  )
}
