/**
 * ATS Metrics Dashboard Route
 * Dedicated page for hiring analytics, funnel metrics,
 * source-of-hire tracking, and time-to-hire reporting.
 *
 * @see Issue #90 (Basic Metrics Dashboard)
 * @see Issue #91 (Source-of-Hire Tracking)
 * @see Issue #92 (Time-to-Hire Reporting)
 */
import { OfficeApplicationsScreen } from '@scf/core/features/office/applications/office-applications-screen'

export default function ATSMetricsRoute() {
  // Reuses the OfficeApplicationsScreen — user can switch to Metrics tab
  return <OfficeApplicationsScreen />
}
