import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@app/core/features/assessments'

export default function AssessmentsLandingPage() {
  return (
    <DashboardLayout
      leftContent={<AssessmentsLandingLeft />}
      rightContent={
        <QuickLinksSidebar>
          <AssessmentsLandingRight />
        </QuickLinksSidebar>
      }
    />
  )
}
