import { IPIPResultsPage } from '@app/core/features/ipip-assessment/components/IPIPResultsPage'
import { AssessmentsLayout } from '@app/ui'

/**
 * IPIP Results Page Route
 * Displays personality assessment results with narrative and chart views
 */
export default function IPIPResultsRoute() {
  return <AssessmentsLayout leftContent={<IPIPResultsPage />} />
}
