import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { EEOReportScreen } from '@scf/core/features/office/compliance/EEOReportScreen'

// OfficeLayout, like the other office screens: a bare `Stack padding="md"` put
// this screen at an 8px gutter where the rest of the office sits at 16 (#1022).
export default function EEOReportsPage() {
  return <OfficeLayout leftContent={<EEOReportScreen />} leftContainerProps={{ minWidth: '100%' }} />
}
