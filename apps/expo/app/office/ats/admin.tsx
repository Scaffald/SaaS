import {
  AdminBackgroundChecksPage,
  BackgroundCheckNavigationMenu,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/core/components/layouts'

export default function OfficeBackgroundChecksAdminScreen() {
  return (
    <DashboardLayout
      leftContent={<AdminBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
