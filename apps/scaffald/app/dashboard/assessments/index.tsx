import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@scf/core/features/assessments'
import { AssessmentsLayout } from '@scf/core/components/layouts'

export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      leftContent={<AssessmentsLandingLeft />}
      rightContent={<AssessmentsLandingRight />}
    />
  )
}
