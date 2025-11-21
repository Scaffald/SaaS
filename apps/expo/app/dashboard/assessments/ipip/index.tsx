import { IPIPAssessmentWizard } from '@app/core/features/ipip-assessment'
import { AssessmentsLayout } from '@app/ui'

export default function IPIPAssessmentPage() {
  return <AssessmentsLayout leftContent={<IPIPAssessmentWizard />} />
}
