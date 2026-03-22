/**
 * Skill Shape Widget - Radar chart showing soft skill category averages
 * Supports toggle between self-assessment and peer-review overlay.
 */

import { useState } from 'react'
import { Pressable } from 'react-native'
import {
  DashboardWidget,
  DashboardWidgetHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { RadarChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useSoftSkills, useSoftSkillsComparison } from '../../../utils/profile-skills-sdk-hooks'

const CATEGORY_LABELS: Record<string, string> = {
  reliability: 'Reliability',
  collaboration: 'Collaboration',
  professionalism: 'Professionalism',
  technical: 'Technical',
}

export function SkillShapeWidget() {
  const { theme } = useThemeContext()
  const [showComparison, setShowComparison] = useState(false)
  const { data: skillsData, isLoading, error } = useSoftSkills()
  const { data: comparisonData } = useSoftSkillsComparison()

  if (error) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Skill Shape" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.fg[theme].error, fontSize: 13 }}>
            Failed to load skill data
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  if (!skillsData?.categoryAverages) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Skill Shape" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            Complete your soft skills self-assessment to see your skill shape.
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  const categories = Object.keys(CATEGORY_LABELS)
  const axes = categories.map((cat) => ({
    label: CATEGORY_LABELS[cat],
    value: skillsData.categoryAverages[cat as keyof typeof skillsData.categoryAverages] ?? 0,
    maxValue: 5,
  }))

  const comparison =
    showComparison && comparisonData?.peer
      ? categories.map((cat) => ({
          label: CATEGORY_LABELS[cat],
          value: comparisonData.peer?.[cat as keyof typeof comparisonData.peer] ?? 0,
        }))
      : undefined

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Skill Shape"
        action={
          comparisonData?.peer ? (
            <Pressable
              onPress={() => setShowComparison(!showComparison)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: showComparison
                  ? colors.primary[50]
                  : colors.bg[theme].subtle,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: showComparison
                    ? colors.primary[600]
                    : colors.text[theme].secondary,
                }}
              >
                {showComparison ? 'Self + Peer' : 'Self Only'}
              </Text>
            </Pressable>
          ) : null
        }
      />

      <Stack align="center" paddingVertical={8}>
        <RadarChart
          axes={axes}
          comparison={comparison}
          size="md"
          showLabels
          showValues
        />
      </Stack>

      {showComparison && (
        <Row gap={16} justify="center" paddingTop={4}>
          <Row gap={4} align="center">
            <Stack
              style={{
                width: 10,
                height: 3,
                backgroundColor: colors.primary[500],
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>Self</Text>
          </Row>
          <Row gap={4} align="center">
            <Stack
              style={{
                width: 10,
                height: 3,
                backgroundColor: colors.orange[500],
                borderRadius: 2,
                borderStyle: 'dashed',
              }}
            />
            <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>Peer</Text>
          </Row>
        </Row>
      )}
    </DashboardWidget>
  )
}
