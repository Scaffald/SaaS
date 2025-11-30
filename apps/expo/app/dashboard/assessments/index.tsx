import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@app/core/features/assessments'
import { AssessmentsLayout } from '@app/core/components/layouts'

export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      leftContent={<AssessmentsLandingLeft />}
      rightContent={<AssessmentsLandingRight />}
    />
  )
}
