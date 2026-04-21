import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Stack, Tabs, useResponsive } from '@scaffald/ui'
import { useState } from 'react'
import { SoftSkillsComparisonWidget } from '../../profile/widgets'
import { IPIPAssessmentWidget } from '../../ipip-assessment'
import { OccupationAssessmentWidget } from '../../occupation-assessment'
import { RIASECAssessmentWidget } from '../../riasec-assessment'
import { GrowthTipCard } from './GrowthTipCard'
import { CompactNewsWidget } from './CompactNewsWidget'
import { CommunitiesWidget } from './CommunitiesWidget'
import { RecentActivityWidget } from './RecentActivityWidget'

const TABS = ['Overview', 'Assessments'] as const
type TabId = (typeof TABS)[number]

function OverviewTab() {
  return (
    <Stack gap={12}>
      <GrowthTipCard />
      <InquiryOverviewWidget />
      <CompactNewsWidget />
      <CommunitiesWidget />
      <RecentActivityWidget />
    </Stack>
  )
}

function AssessmentsTab() {
  return (
    <Stack gap={12}>
      <SoftSkillsComparisonWidget showCTA />
      <IPIPAssessmentWidget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </Stack>
  )
}

const TAB_CONTENT: Record<TabId, React.ComponentType> = {
  Overview: OverviewTab,
  Assessments: AssessmentsTab,
}

export function MobileDashboardTabs() {
  const { isMobile } = useResponsive()
  const [activeTab, setActiveTab] = useState<TabId>('Overview')

  if (!isMobile) return null

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabId)}
      type="line"
      containerStyle={{ paddingVertical: 10 }}
    >
      {TABS.map((tab) => {
        const Content = TAB_CONTENT[tab]
        return (
          <Tabs.Item key={tab} value={tab}>
            <Tabs.Trigger>{tab}</Tabs.Trigger>
            <Tabs.Content>
              <Content />
            </Tabs.Content>
          </Tabs.Item>
        )
      })}
    </Tabs>
  )
}
