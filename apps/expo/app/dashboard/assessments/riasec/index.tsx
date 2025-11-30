import { RIASECAssessmentWizard } from '@app/core/features/riasec-assessment'
import { AssessmentsLayout } from '@app/core/components/layouts'

export default function RIASECAssessmentPage() {
  return <AssessmentsLayout leftContent={<RIASECAssessmentWizard />} />
}
