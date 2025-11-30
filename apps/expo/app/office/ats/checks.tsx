import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundChecksPage,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/core/components/layouts'

export default function OfficeBackgroundChecksScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
