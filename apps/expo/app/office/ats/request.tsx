import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundCheckRequestForm,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/ui'

export default function OfficeBackgroundCheckRequestScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundCheckRequestForm />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
