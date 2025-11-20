import { AssessmentsLandingLeft, AssessmentsLandingRight } from '@app/core/features/assessments'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

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
