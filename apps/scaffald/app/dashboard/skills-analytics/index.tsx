import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { SkillsAnalyticsLeft } from '@scf/core/features/skills-analytics/skills-analytics-left'
import { SkillsAnalyticsRight } from '@scf/core/features/skills-analytics/skills-analytics-right'

export default function Screen() {
  return (
    <DashboardPage
      leftContent={<SkillsAnalyticsLeft />}
      rightContent={<SkillsAnalyticsRight />}
    />
  )
}
