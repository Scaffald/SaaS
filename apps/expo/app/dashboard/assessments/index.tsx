import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@app/core/features/assessments'
import { AssessmentsLayout } from '@app/ui'

export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      leftContent={<AssessmentsLandingLeft />}
      rightContent={<AssessmentsLandingRight />}
    />
  )
}
