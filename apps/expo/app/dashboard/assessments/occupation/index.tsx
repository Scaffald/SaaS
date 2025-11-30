import { OccupationAssessmentWizard } from '@app/core/features/occupation-assessment'
import { AssessmentsLayout } from '@app/core/components/layouts'

export default function OccupationAssessmentPage() {
  return <AssessmentsLayout leftContent={<OccupationAssessmentWizard />} />
}
