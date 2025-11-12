import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundChecksPage,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/ui'

export default function OfficeBackgroundChecksScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundChecksPage />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
