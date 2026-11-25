import { OfficeLayout } from '@scf/core/components/layouts'
import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import {
  isDeliveryStatus,
  OfficeNotificationsConsole,
} from '@scf/core/features/office/office-notifications-console'
import { useLocalSearchParams } from 'expo-router'

/**
 * The notification delivery console (#1201), under Admin → System since
 * #1439. It holds the System alerts section too (#1242).
 *
 * `?status=failed` opens it on that filter; the Office home links here that way.
 */
export default function AdminNotificationsScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>()
  return (
    <>
      <AdminGroupTabs />
      <OfficeLayout
        leftContent={
          <OfficeNotificationsConsole initialStatus={isDeliveryStatus(status) ? status : undefined} />
        }
        leftContainerProps={{ minWidth: '100%' }}
      />
    </>
  )
}
