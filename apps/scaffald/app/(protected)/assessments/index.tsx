import { AssessmentsLayout } from '@scf/core/components/layouts'
import { AssessmentsHub, AssessmentsLandingRight } from '@scf/core/features/assessments'
import { SkillsAnalyticsLeft } from '@scf/core/features/skills-analytics/skills-analytics-left'
import { SkillsAnalyticsRight } from '@scf/core/features/skills-analytics/skills-analytics-right'
import { Separator, Stack } from '@scaffald/ui'

/**
 * The assessments hub.
 *
 * The list of assessments used to be the sidebar and the skills analytics the
 * main column, which put the thing the screen is named after in the narrow
 * 38% column. The list leads now; the analytics it produces follow it, and
 * the sidebar carries the explainer that was written for it and never
 * rendered anywhere (#831).
 */
export default function AssessmentsLandingPage() {
  return (
    <AssessmentsLayout
      showTabs={false}
      leftContent={
        <Stack gap={24}>
          <AssessmentsHub />
          <Separator />
          <SkillsAnalyticsLeft />
          <SkillsAnalyticsRight />
        </Stack>
      }
      rightContent={<AssessmentsLandingRight />}
    />
  )
}
