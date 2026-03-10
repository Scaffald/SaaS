import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES } from '@scf/core/constants/routes'
import { BackgroundCheckProvidersScreen } from '@scf/core/features/office/integrations/BackgroundCheckProvidersScreen'

export default function BackgroundCheckProvidersPage() {
  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Integrations', href: ROUTES.OFFICE.INTEGRATIONS.path },
        { label: 'Background Check Providers', href: ROUTES.OFFICE.INTEGRATIONS.BACKGROUND_CHECKS.path },
      ]}
      leftContent={<BackgroundCheckProvidersScreen />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
