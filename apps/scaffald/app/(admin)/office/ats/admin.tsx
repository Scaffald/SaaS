import {
  AdminBackgroundChecksPage,
  BackgroundCheckNavigationMenu,
} from '@scf/core/features/background-check'
import { DashboardLayout } from '@scf/core/components/layouts'

export default function OfficeBackgroundChecksAdminScreen() {
  return (
    <DashboardLayout
      leftContent={<AdminBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
