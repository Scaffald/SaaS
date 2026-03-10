/**
 * Technology Skills Widget - Lists in-demand technologies for the user's occupation.
 *
 * @see Issue #103
 */

import { Check, Cpu } from 'lucide-react-native'
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
import { colors } from '@scaffald/ui/tokens'
import { useOccupationStatus, useRIASECStatus } from '@scf/core/utils/onet-sdk-hooks'

/** Technology skills by occupation */
const TECH_SKILLS: Record<string, Array<{ name: string; category: string }>> = {
  '11-9021.00': [ // Construction Manager
    { name: 'Procore', category: 'Project Management' },
    { name: 'Bluebeam Revu', category: 'Document Management' },
    { name: 'AutoCAD', category: 'Design' },
    { name: 'Microsoft Project', category: 'Scheduling' },
    { name: 'BIM 360', category: 'Collaboration' },
    { name: 'Primavera P6', category: 'Scheduling' },
  ],
  '47-2111.00': [ // Electrician
    { name: 'AutoCAD Electrical', category: 'Design' },
    { name: 'PLC Programming', category: 'Controls' },
    { name: 'Multisim', category: 'Simulation' },
    { name: 'EasyPower', category: 'Analysis' },
    { name: 'SKM PowerTools', category: 'Analysis' },
  ],
  '17-2051.00': [ // Civil Engineer
    { name: 'AutoCAD Civil 3D', category: 'Design' },
    { name: 'Revit', category: 'BIM' },
    { name: 'STAAD Pro', category: 'Structural' },
    { name: 'ArcGIS', category: 'GIS' },
    { name: 'HEC-RAS', category: 'Hydraulics' },
  ],
}

/** Default tech skills */
const DEFAULT_TECH = [
  { name: 'Procore', category: 'Project Management' },
  { name: 'AutoCAD', category: 'Design' },
  { name: 'Microsoft Office', category: 'Productivity' },
  { name: 'Bluebeam', category: 'Document Mgmt' },
  { name: 'PlanGrid', category: 'Field Mgmt' },
]

export function TechnologySkillsWidget() {
  const { theme } = useThemeContext()
  const { data: occupationStatus, isLoading: occLoading } = useOccupationStatus()
  const { data: riasecStatus, isLoading: riasecLoading } = useRIASECStatus()
  const [knownTech, setKnownTech] = useState<Set<string>>(new Set())

  if (occLoading || riasecLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  if (!riasecStatus?.isCompleted) {
    return null
  }

  const targetOccupations = occupationStatus?.occupations ?? []
  const primaryCode = targetOccupations[0]?.onet_code
  const techSkills = primaryCode ? (TECH_SKILLS[primaryCode] ?? DEFAULT_TECH) : DEFAULT_TECH

  const toggleTech = (name: string) => {
    setKnownTech((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const knownCount = knownTech.size
  const totalCount = techSkills.length

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Technology Skills"
        action={
          <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
            {knownCount}/{totalCount} known
          </Text>
        }
      />

      <Stack gap={6}>
        {techSkills.map((tech) => {
          const isKnown = knownTech.has(tech.name)
          return (
            <Pressable key={tech.name} onPress={() => toggleTech(tech.name)}>
              <Row
                gap={10}
                align="center"
                padding="sm"
                style={{
                  backgroundColor: isKnown
                    ? `${colors.success[500]}10`
                    : colors.bg[theme].subtle,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: isKnown
                    ? `${colors.success[500]}40`
                    : 'transparent',
                }}
              >
                <Stack
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    backgroundColor: isKnown
                      ? colors.success[500]
                      : colors.bg[theme].default,
                    borderWidth: isKnown ? 0 : 1,
                    borderColor: colors.border[theme].default,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isKnown ? (
                    <Check size={14} color="#fff" />
                  ) : (
                    <Cpu size={14} color={colors.icon[theme].default} />
                  )}
                </Stack>
                <Stack style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text[theme].primary,
                      fontSize: 14,
                      textDecorationLine: isKnown ? 'line-through' : 'none',
                    }}
                  >
                    {tech.name}
                  </Text>
                </Stack>
                <Stack
                  style={{
                    backgroundColor: colors.bg[theme].default,
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>
                    {tech.category}
                  </Text>
                </Stack>
              </Row>
            </Pressable>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
