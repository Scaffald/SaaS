import { IPIPResultsPage } from '@scf/core/features/ipip-assessment/components/IPIPResultsPage'
import { AssessmentsLayout } from '@scf/core/components/layouts'

/**
 * IPIP Results Page Route
 * Displays personality assessment results with narrative and chart views
 */
export default function IPIPResultsRoute() {
  return <AssessmentsLayout leftContent={<IPIPResultsPage />} />
}
