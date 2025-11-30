import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundCheckRequestForm,
} from '@app/core/features/background-check'
import { DashboardLayout } from '@app/core/components/layouts'

export default function OfficeBackgroundCheckRequestScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundCheckRequestForm />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
