import { RIASECAssessmentWizard } from '@app/core/features/riasec-assessment'
import { AssessmentsLayout } from '@app/ui'

export default function RIASECAssessmentPage() {
  return <AssessmentsLayout leftContent={<RIASECAssessmentWizard />} />
}
