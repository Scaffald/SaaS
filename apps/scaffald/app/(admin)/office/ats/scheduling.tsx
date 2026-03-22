import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES } from '@scf/core/constants/routes'
import { CalendarSchedulingScreen } from '@scf/core/features/office/scheduling/CalendarSchedulingScreen'

export default function SchedulingPage() {
  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'ATS', href: ROUTES.OFFICE.ATS.path },
        { label: 'Scheduling', href: ROUTES.OFFICE.ATS.SCHEDULING.path },
      ]}
      leftContent={<CalendarSchedulingScreen />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
