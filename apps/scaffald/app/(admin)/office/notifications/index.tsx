import { OfficeLayout } from '@scf/core/components/layouts'
import {
  isDeliveryStatus,
  OfficeNotificationsConsole,
} from '@scf/core/features/office/office-notifications-console'
import { useLocalSearchParams } from 'expo-router'

/**
 * The notification delivery console, on its own Office route (#1201). It was
 * stacked under the overview on /office, with the storage dashboard below it,
 * so the Office home was several screens of consoles. It holds the System
 * alerts section too (#1242).
 *
 * `?status=failed` opens it on that filter; the Office home links here that way.
 */
export default function OfficeNotificationsScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>()
  return (
    <OfficeLayout
      leftContent={
        <OfficeNotificationsConsole initialStatus={isDeliveryStatus(status) ? status : undefined} />
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
