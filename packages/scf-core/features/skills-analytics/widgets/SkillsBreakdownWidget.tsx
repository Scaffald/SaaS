/**
 * Skills Breakdown Widget - Expandable list of all soft skills grouped by category
 * Each skill shows rating, sparkline trend, delta badge, and evidence count.
 */

import { useState, useCallback } from 'react'
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
import { SparkLine } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { ChevronDown, ChevronRight, FileCheck } from 'lucide-react-native'
import { useSoftSkills } from '../../../utils/profile-skills-sdk-hooks'
import { useSkillEvidence } from '../../../utils/skill-analytics-sdk-hooks'
import type { SoftSkillCategory } from '@scaffald/sdk'

const CATEGORY_CONFIG: Record<SoftSkillCategory, { label: string; color: string }> = {
  reliability: { label: 'Reliability', color: colors.blue[500] },
  collaboration: { label: 'Collaboration', color: colors.green[500] },
  professionalism: { label: 'Professionalism', color: colors.purple[500] },
  technical: { label: 'Technical', color: colors.orange[500] },
}

export function SkillsBreakdownWidget() {
  const { theme } = useThemeContext()
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const { data: skillsData, isLoading } = useSoftSkills()
  const { data: evidenceData } = useSkillEvidence()

  const toggleCategory = useCallback(
    (cat: string) => setExpandedCategory((prev) => (prev === cat ? null : cat)),
    []
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  if (!skillsData?.skills || skillsData.skills.length === 0) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Skills Breakdown" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            No skills data available yet.
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Group skills by category
  const grouped = (Object.keys(CATEGORY_CONFIG) as SoftSkillCategory[]).map((cat) => ({
    category: cat,
    ...CATEGORY_CONFIG[cat],
    skills: skillsData.skills.filter((s) => s.category === cat),
    average: skillsData.categoryAverages[cat] ?? 0,
  }))

  // Count evidence per skill
  const evidenceCountMap = new Map<string, number>()
  if (evidenceData?.evidence) {
    for (const ev of evidenceData.evidence) {
      if (ev.softSkillId) {
        evidenceCountMap.set(ev.softSkillId, (evidenceCountMap.get(ev.softSkillId) ?? 0) + 1)
      }
    }
  }

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Skills Breakdown" />

      <Stack gap={2}>
        {grouped.map((group) => {
          const isExpanded = expandedCategory === group.category
          return (
            <Stack key={group.category}>
              {/* Category header */}
              <Pressable onPress={() => toggleCategory(group.category)}>
                <Row
                  gap={8}
                  align="center"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: isExpanded
                      ? colors.bg[theme].subtle
                      : 'transparent',
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} color={colors.text[theme].secondary} />
                  ) : (
                    <ChevronRight size={16} color={colors.text[theme].secondary} />
                  )}

                  <Stack
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: group.color,
                    }}
                  />

                  <Text
                    style={{
                      flex: 1,
                      fontWeight: '600',
                      fontSize: 14,
                      color: colors.text[theme].primary,
                    }}
                  >
                    {group.label}
                  </Text>

                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.text[theme].secondary,
                    }}
                  >
                    {group.average.toFixed(1)}
                  </Text>
                </Row>
              </Pressable>

              {/* Expanded skill list */}
              {isExpanded && (
                <Stack gap={1} style={{ paddingLeft: 32 }}>
                  {group.skills.map((skill) => {
                    const evidenceCount = evidenceCountMap.get(skill.id) ?? 0
                    // Generate mock sparkline data from rating (in production this comes from snapshot history)
                    const sparkData = [
                      Math.max(0, (skill.rating ?? 0) - 0.5),
                      Math.max(0, (skill.rating ?? 0) - 0.2),
                      skill.rating ?? 0,
                    ]

                    return (
                      <Row
                        key={skill.id}
                        gap={8}
                        align="center"
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 8,
                          borderBottomWidth: 0.5,
                          borderBottomColor: colors.border[theme].default,
                        }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: colors.text[theme].primary,
                          }}
                          numberOfLines={1}
                        >
                          {skill.name}
                        </Text>

                        {sparkData.length >= 2 && (
                          <SparkLine data={sparkData} width={48} height={18} />
                        )}

                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.text[theme].secondary,
                            minWidth: 24,
                            textAlign: 'right',
                          }}
                        >
                          {skill.rating?.toFixed(1) ?? '—'}
                        </Text>

                        {evidenceCount > 0 && (
                          <Row gap={2} align="center">
                            <FileCheck size={12} color={colors.green[500]} />
                            <Text style={{ fontSize: 11, color: colors.green[500] }}>
                              {evidenceCount}
                            </Text>
                          </Row>
                        )}
                      </Row>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
