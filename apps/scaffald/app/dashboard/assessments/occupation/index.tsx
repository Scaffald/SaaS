import { OccupationAssessmentWizard } from '@scf/core/features/occupation-assessment'
import { AssessmentsLayout } from '@scf/core/components/layouts'

export default function OccupationAssessmentPage() {
  return <AssessmentsLayout leftContent={<OccupationAssessmentWizard />} />
}
