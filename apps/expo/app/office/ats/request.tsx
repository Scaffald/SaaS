import {
  BackgroundCheckNavigationMenu,
  OrganizationBackgroundCheckRequestForm,
} from '@app/core/features/background-check'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function OfficeBackgroundCheckRequestScreen() {
  return (
    <DashboardLayout
      leftContent={<OrganizationBackgroundCheckRequestForm />}
      rightContent={
        <QuickLinksSidebar>
          <BackgroundCheckNavigationMenu />
        </QuickLinksSidebar>
      }
    />
  )
}
