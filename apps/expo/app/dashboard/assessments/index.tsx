import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@app/core/features/assessments'
import { AssessmentsLayout, QuickLinksSidebar } from '@app/ui'

export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      showBreadcrumb
      leftContent={<AssessmentsLandingLeft />}
      rightContent={
        <QuickLinksSidebar>
          <AssessmentsLandingRight />
        </QuickLinksSidebar>
      }
    />
  )
}
