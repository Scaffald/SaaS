import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type React from 'react'
import { useState } from 'react'
import { Pressable, } from 'react-native'
import { ProfileSnapshotWidget, SoftSkillsComparisonWidget } from '../../profile/widgets'
import { IPIPAssessmentWidget } from '../../ipip-assessment'
import { OccupationAssessmentWidget } from '../../occupation-assessment'
import { RIASECAssessmentWidget } from '../../riasec-assessment'
import { WeeklyPulseWidget } from '../../luscher-test/components/WeeklyPulseWidget'
import { CareerRecommendationsWidget } from '../widgets/CareerRecommendationsWidget'
import { SkillsGapWidget } from '../widgets/SkillsGapWidget'
import { CareerPathWidget } from '../widgets/CareerPathWidget'
import { TechnologySkillsWidget } from '../widgets/TechnologySkillsWidget'

const TABS = ['Overview', 'Assessments', 'Career'] as const
type TabId = (typeof TABS)[number]

function OverviewTab() {
  return (
    <Stack gap={20}>
      <ProfileSnapshotWidget />
      <SoftSkillsComparisonWidget showCTA />
      <InquiryOverviewWidget />
    </Stack>
  )
}

function AssessmentsTab() {
  return (
    <Stack gap={20}>
      <WeeklyPulseWidget />
      <IPIPAssessmentWidget />
      <RIASECAssessmentWidget />
      <OccupationAssessmentWidget />
    </Stack>
  )
}

function CareerTab() {
  return (
    <Stack gap={20}>
      <CareerRecommendationsWidget />
      <SkillsGapWidget />
      <CareerPathWidget />
      <TechnologySkillsWidget />
    </Stack>
  )
}

const TAB_CONTENT: Record<TabId, React.ComponentType> = {
  Overview: OverviewTab,
  Assessments: AssessmentsTab,
  Career: CareerTab,
}

export function MobileDashboardTabs() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState<TabId>('Overview')

  if (!isMobile) return null

  const ActiveContent = TAB_CONTENT[activeTab]

  return (
    <Stack gap={16}>
      {/* Tab bar */}
      <Row gap={8}>
        {TABS.map((tab) => {
          const isActive = tab === activeTab
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive
                  ? colors.primary[500]
                  : colors.bg[theme].muted,
              }}
            >
              <Text
                size="sm"
                weight={isActive ? 'semibold' : 'regular'}
                style={{
                  color: isActive ? '#ffffff' : colors.text[theme].secondary,
                }}
              >
                {tab}
              </Text>
            </Pressable>
          )
        })}
      </Row>

      {/* Tab content */}
      <ActiveContent />
    </Stack>
  )
}
