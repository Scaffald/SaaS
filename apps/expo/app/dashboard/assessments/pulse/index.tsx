import { LuscherTestWizard } from '@app/core/features/luscher-test'
import { AssessmentsLayout } from '@app/ui'

/**
 * Luscher Test Assessment Page
 * Displays the unified Luscher Color Test wizard
 */
export default function LuscherTestPage() {
  return <AssessmentsLayout leftContent={<LuscherTestWizard />} />
}
