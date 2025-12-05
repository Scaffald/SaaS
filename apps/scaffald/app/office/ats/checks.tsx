import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundChecksPage,
} from '@scf/core/features/background-check'
import { DashboardLayout } from '@scf/core/components/layouts'

export default function OfficeBackgroundChecksScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
