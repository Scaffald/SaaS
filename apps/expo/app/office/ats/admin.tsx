import {
  AdminBackgroundChecksPage,
  BackgroundCheckNavigationMenu,
} from '@app/core/features/background-check'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function OfficeBackgroundChecksAdminScreen() {
  return (
    <DashboardLayout
      leftContent={<AdminBackgroundChecksPage />}
      rightContent={
        <QuickLinksSidebar>
          <BackgroundCheckNavigationMenu />
        </QuickLinksSidebar>
      }
    />
  )
}
