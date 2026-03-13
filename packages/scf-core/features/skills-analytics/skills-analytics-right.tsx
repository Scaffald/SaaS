/**
 * Skills Analytics Dashboard - Right Column
 * Contains: Summary Stats, Recent Changes, Gap Analysis
 */

import { Stack } from '@scaffald/ui'
import { SummaryStatsWidget } from './widgets/SummaryStatsWidget'
import { RecentChangesWidget } from './widgets/RecentChangesWidget'
import { GapAnalysisWidget } from './widgets/GapAnalysisWidget'
import { EvidencePanel } from './widgets/EvidencePanel'

export function SkillsAnalyticsRight() {
  return (
    <Stack gap={20}>
      <SummaryStatsWidget />
      <RecentChangesWidget />
      <EvidencePanel showAdd />
      <GapAnalysisWidget />
    </Stack>
  )
}
