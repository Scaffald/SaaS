import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { AdminGroupTabs } from '@scf/core/features/admin/AdminGroupTabs'
import { HRISIntegrationsScreen } from '@scf/core/features/office/integrations/HRISIntegrationsScreen'

// Admin → Integrations (#1439). The section's folder tabs and the row of
// Integrations pages say where you are, so no breadcrumb.
export default function HRISPage() {
  return (
    <>
      <AdminGroupTabs />
      <OfficeLayout leftContent={<HRISIntegrationsScreen />} leftContainerProps={{ minWidth: '100%' }} />
    </>
  )
}
