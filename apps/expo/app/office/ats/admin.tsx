import {
  AdminBackgroundChecksPage,
  BackgroundCheckNavigationMenu,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/ui'

export default function OfficeBackgroundChecksAdminScreen() {
  return (
    <DashboardLayout
      leftContent={<AdminBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
