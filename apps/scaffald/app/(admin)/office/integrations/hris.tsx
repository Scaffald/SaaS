import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES } from '@scf/core/constants/routes'
import { HRISIntegrationsScreen } from '@scf/core/features/office/integrations/HRISIntegrationsScreen'

export default function HRISPage() {
  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Integrations', href: ROUTES.OFFICE.INTEGRATIONS.path },
        { label: 'HRIS & Payroll', href: ROUTES.OFFICE.INTEGRATIONS.HRIS.path },
      ]}
      leftContent={<HRISIntegrationsScreen />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
