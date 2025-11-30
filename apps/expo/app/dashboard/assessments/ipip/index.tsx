import { IPIPAssessmentWizard } from '@app/core/features/ipip-assessment'
import { AssessmentsLayout } from '@app/core/components/layouts'

export default function IPIPAssessmentPage() {
  return <AssessmentsLayout leftContent={<IPIPAssessmentWizard />} />
}
