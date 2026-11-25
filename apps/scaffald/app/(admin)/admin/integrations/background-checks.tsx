import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import { BackgroundCheckProvidersScreen } from '@scf/core/features/office/integrations/BackgroundCheckProvidersScreen'

// Admin → Integrations (#1439). The section's folder tabs and the row of
// Integrations pages say where you are, so no breadcrumb.
export default function BackgroundCheckProvidersPage() {
  return (
    <>
      <AdminGroupTabs />
      <OfficeLayout leftContent={<BackgroundCheckProvidersScreen />} leftContainerProps={{ minWidth: '100%' }} />
    </>
  )
}
