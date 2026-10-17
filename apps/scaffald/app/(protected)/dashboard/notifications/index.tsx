import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { notificationsKicker } from '@scf/core/features/notifications/audience'
import { useAppMode } from '@scf/core/utils/useAppMode'
import {
  NotificationsCenterScreen,
  NotificationsHeaderActions,
} from '@scf/core/features/notifications/NotificationsCenterScreen'

export default function NotificationsPage() {
  // The list below is scoped to the mode; the kicker says which (#1178).
  const { mode } = useAppMode()
  return (
    <DashboardPage
      showBreadcrumb={false}
      // A reading column, as the prototype's inbox: at full width a row's
      // title sat ~1000px from its timestamp (#1160).
      readingWidth
      pageTitle="Notifications"
      screenKicker={notificationsKicker(mode)}
      screenActions={<NotificationsHeaderActions />}
      leftContent={<NotificationsCenterScreen />}
    />
  )
}
