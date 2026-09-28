import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  NotificationsCenterScreen,
  NotificationsHeaderActions,
} from '@scf/core/features/notifications/NotificationsCenterScreen'

export default function NotificationsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Notifications"
      screenKicker="Everything that needs you"
      screenActions={<NotificationsHeaderActions />}
      leftContent={<NotificationsCenterScreen />}
    />
  )
}
