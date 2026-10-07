import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ProjectHiringScreen } from '@scf/core/features/office/applications/components/ProjectHiringScreen'

// OfficeLayout, like the other office screens: a bare `Stack padding="md"` put
// this screen at an 8px gutter where the rest of the office sits at 16 (#1022).
export default function ProjectHiringPage() {
  return <OfficeLayout leftContent={<ProjectHiringScreen />} leftContainerProps={{ minWidth: '100%' }} />
}
