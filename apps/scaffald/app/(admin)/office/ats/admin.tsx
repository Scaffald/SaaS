import { AdminBackgroundChecksPage } from '@scf/core/features/background-check'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'

// OfficeLayout, like the other ATS screens, and no right rail (#1099). The rail
// was BackgroundCheckNavigationMenu, links the ATS sub-tab strip already gives,
// and it cost the review table ~400px: the last column ("Com…") and the
// worker emails were cut off at 1440.
export default function OfficeBackgroundChecksAdminScreen() {
  return (
    <OfficeLayout
      leftContent={<AdminBackgroundChecksPage />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
