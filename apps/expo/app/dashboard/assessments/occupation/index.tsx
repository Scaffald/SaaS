import { OccupationAssessmentWizard } from '@app/core/features/occupation-assessment'
import { AssessmentsLayout } from '@app/ui'

export default function OccupationAssessmentPage() {
  return <AssessmentsLayout leftContent={<OccupationAssessmentWizard />} />
}
