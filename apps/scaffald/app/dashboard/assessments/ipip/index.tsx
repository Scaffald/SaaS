import { IPIPAssessmentWizard } from '@scf/core/features/ipip-assessment'
import { AssessmentsLayout } from '@scf/core/components/layouts'

export default function IPIPAssessmentPage() {
  return <AssessmentsLayout leftContent={<IPIPAssessmentWizard />} />
}
