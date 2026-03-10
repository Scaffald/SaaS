/**
 * Skills Gap Widget - Shows missing skills for target occupations with quick-add buttons.
 *
 * @see Issue #103
 */

import { AlertCircle, Plus } from 'lucide-react-native'
import { Pressable } from 'react-native'
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'

/** Common skill gaps for construction-related occupations */
const COMMON_SKILL_GAPS: Record<string, Array<{ name: string; importance: 'high' | 'medium' | 'low' }>> = {
  // Construction Manager
  '11-9021.00': [
    { name: 'Project Scheduling', importance: 'high' },
    { name: 'Cost Estimation', importance: 'high' },
    { name: 'Building Codes', importance: 'medium' },
    { name: 'Safety Management', importance: 'medium' },
    { name: 'Contract Negotiation', importance: 'low' },
  ],
  // Civil Engineer
  '17-2051.00': [
    { name: 'Structural Analysis', importance: 'high' },
    { name: 'AutoCAD', importance: 'high' },
    { name: 'Geotechnical Engineering', importance: 'medium' },
    { name: 'Environmental Compliance', importance: 'medium' },
  ],
  // Electrician
  '47-2111.00': [
    { name: 'NEC Code Knowledge', importance: 'high' },
    { name: 'PLC Programming', importance: 'medium' },
    { name: 'Solar Installation', importance: 'medium' },
    { name: 'Fire Alarm Systems', importance: 'low' },
  ],
}

/** Fallback skills when no specific occupation data exists */
const DEFAULT_SKILLS = [
  { name: 'Safety Certification', importance: 'high' as const },
  { name: 'Blueprint Reading', importance: 'high' as const },
  { name: 'Project Management', importance: 'medium' as const },
  { name: 'Equipment Operation', importance: 'medium' as const },
]

function getImportanceColor(importance: 'high' | 'medium' | 'low'): string {
  switch (importance) {
    case 'high': return colors.error[500]
    case 'medium': return colors.warning[500]
    case 'low': return colors.blue[500]
  }
}

export function SkillsGapWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: occupationStatus, isLoading } = useOccupationStatus()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  // Only show if user has selected target occupations
  const targetOccupations = occupationStatus?.occupations ?? []
  if (!occupationStatus?.isCompleted || targetOccupations.length === 0) {
    return null
  }

  // Get skills for the first target occupation
  const primaryTarget = targetOccupations[0]
  const skills = COMMON_SKILL_GAPS[primaryTarget.onet_code] ?? DEFAULT_SKILLS

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Skills Gap"
        action={
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
          >
            My Skills
          </Button>
        }
      />

      <Stack gap={4}>
        <Text style={{ color: colors.text[theme].secondary, fontSize: 12, marginBottom: 4 }}>
          Missing skills for {primaryTarget.title}
        </Text>

        {skills.map((skill) => (
          <Row
            key={skill.name}
            gap={8}
            align="center"
            padding="sm"
            style={{
              backgroundColor: colors.bg[theme].subtle,
              borderRadius: 6,
            }}
          >
            <AlertCircle size={14} color={getImportanceColor(skill.importance)} />
            <Text style={{ flex: 1, color: colors.text[theme].primary, fontSize: 14 }}>
              {skill.name}
            </Text>
            <Stack
              style={{
                backgroundColor: `${getImportanceColor(skill.importance)}20`,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 10, color: getImportanceColor(skill.importance) }}>
                {skill.importance}
              </Text>
            </Stack>
            <Pressable onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}>
              <Stack
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.bg[theme].default,
                  borderWidth: 1,
                  borderColor: colors.border[theme].default,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={14} color={colors.icon[theme].default} />
              </Stack>
            </Pressable>
          </Row>
        ))}
      </Stack>
    </DashboardWidget>
  )
}
