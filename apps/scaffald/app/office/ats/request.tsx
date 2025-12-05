import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundCheckRequestForm,
} from '@scf/core/features/background-check'
import { DashboardLayout } from '@scf/core/components/layouts'

export default function OfficeBackgroundCheckRequestScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundCheckRequestForm />}
      rightContent={<BackgroundCheckNavigationMenu />}
    />
  )
}
