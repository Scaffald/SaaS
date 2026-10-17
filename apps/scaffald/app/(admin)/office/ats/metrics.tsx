/**
 * ATS Metrics Dashboard Route
 * Dedicated page for hiring analytics, funnel metrics,
 * source-of-hire tracking, and time-to-hire reporting.
 *
 * @see Issue #90 (Basic Metrics Dashboard)
 * @see Issue #91 (Source-of-Hire Tracking)
 * @see Issue #92 (Time-to-Hire Reporting)
 */
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { ATSMetricsScreen } from '@scf/core/features/office/applications/ATSMetricsScreen'

// Inside OfficeLayout, so the ATS sub-tab strip stays up (#1203). This route
// rendered the full Applications screen on its Metrics view, which has no
// strip, so the ATS Metrics tab took you out of the section.
export default function ATSMetricsRoute() {
  return (
    <OfficeLayout leftContent={<ATSMetricsScreen />} leftContainerProps={{ minWidth: '100%' }} />
  )
}
