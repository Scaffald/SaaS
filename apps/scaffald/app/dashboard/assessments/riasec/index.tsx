import { RIASECAssessmentWizard } from '@scf/core/features/riasec-assessment'
import { AssessmentsLayout } from '@scf/core/components/layouts'

export default function RIASECAssessmentPage() {
  return <AssessmentsLayout leftContent={<RIASECAssessmentWizard />} />
}
