import { OrganizationBackgroundCheckRequestForm } from '@scf/core/features/background-check'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'

// OfficeLayout, with the ATS sub-tab strip, rather than DashboardLayout and a
// navigation rail that repeated the strip (#1202).
export default function OfficeBackgroundCheckRequestScreen() {
  return (
    <OfficeLayout
      leftContent={<OrganizationBackgroundCheckRequestForm />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
