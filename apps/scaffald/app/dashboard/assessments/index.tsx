import { AssessmentsLayout } from '@scf/core/components/layouts'
import { AssessmentsLandingLeft } from '@scf/core/features/assessments'
import { SkillsAnalyticsLeft } from '@scf/core/features/skills-analytics/skills-analytics-left'
import { SkillsAnalyticsRight } from '@scf/core/features/skills-analytics/skills-analytics-right'
import { Stack } from '@scaffald/ui'

export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      showTabs={false}
      leftContent={
        <Stack gap={20}>
          <SkillsAnalyticsLeft />
          <SkillsAnalyticsRight />
        </Stack>
      }
      rightContent={<AssessmentsLandingLeft />}
    />
  )
}
