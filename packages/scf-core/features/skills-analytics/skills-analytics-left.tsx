/**
 * Skills Analytics Dashboard - Left Column
 * Contains: Skill Shape (Radar), Progression Timeline, Skills Breakdown
 */

import { Stack } from '@scaffald/ui'
import { SkillShapeWidget } from './widgets/SkillShapeWidget'
import { ProgressionTimelineWidget } from './widgets/ProgressionTimelineWidget'
import { SkillsBreakdownWidget } from './widgets/SkillsBreakdownWidget'

export function SkillsAnalyticsLeft() {
  return (
    <Stack gap={20}>
      <SkillShapeWidget />
      <ProgressionTimelineWidget />
      <SkillsBreakdownWidget />
    </Stack>
  )
}
