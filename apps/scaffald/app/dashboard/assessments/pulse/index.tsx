import { LuscherTestWizard } from '@scf/core/features/luscher-test'
import { AssessmentsLayout } from '@scf/core/components/layouts'

/**
 * Luscher Test Assessment Page
 * Displays the unified Luscher Color Test wizard
 */
export default function LuscherTestPage() {
  return <AssessmentsLayout leftContent={<LuscherTestWizard />} />
}
