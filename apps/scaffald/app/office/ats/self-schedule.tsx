import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ROUTES } from '@scf/core/constants/routes'
import { SelfScheduleScreen } from '@scf/core/features/office/scheduling/SelfScheduleScreen'

export default function SelfSchedulePage() {
  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'ATS', href: ROUTES.OFFICE.ATS.path },
        { label: 'Self-Schedule', href: ROUTES.OFFICE.ATS.SELF_SCHEDULE.path },
      ]}
      leftContent={<SelfScheduleScreen />}
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
