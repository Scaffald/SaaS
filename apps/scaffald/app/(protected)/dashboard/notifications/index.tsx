import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { NotificationsCenterScreen } from '@scf/core/features/notifications/NotificationsCenterScreen'

export default function NotificationsPage() {
  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle="Notifications"
      leftContent={<NotificationsCenterScreen />}
    />
  )
}
