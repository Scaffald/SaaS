import { OrganizationBackgroundChecksPage } from '@scf/core/features/background-check'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'

// OfficeLayout, like the review queue beside it (#1202). DashboardLayout gave
// this page a different canvas and no ATS sub-tab strip, and its right rail was
// BackgroundCheckNavigationMenu — links the strip already gives.
export default function OfficeBackgroundChecksScreen() {
  return (
    <OfficeLayout
      leftContent={<OrganizationBackgroundChecksPage />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
