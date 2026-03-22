/**
 * Career Path Widget - Shows adjacent career paths with transferable skill overlap.
 *
 * @see Issue #103
 */

import { ArrowRight, TrendingUp } from 'lucide-react-native'
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
import { useRouter } from 'expo-router'
import { ROUTES } from '@scf/core/constants/routes'

/** Adjacent career paths for common construction occupations */
const ADJACENT_CAREERS: Record<string, Array<{ title: string; onetCode: string; overlapPercent: number; direction: 'lateral' | 'up' }>> = {
  '11-9021.00': [ // Construction Manager
    { title: 'Project Manager', onetCode: '11-9199.02', overlapPercent: 85, direction: 'lateral' },
    { title: 'General Contractor', onetCode: '11-9021.01', overlapPercent: 92, direction: 'up' },
    { title: 'Facilities Manager', onetCode: '11-3013.00', overlapPercent: 72, direction: 'lateral' },
  ],
  '47-2111.00': [ // Electrician
    { title: 'Electrical Supervisor', onetCode: '47-1011.00', overlapPercent: 88, direction: 'up' },
    { title: 'Solar Installer', onetCode: '47-2231.00', overlapPercent: 76, direction: 'lateral' },
    { title: 'HVAC Technician', onetCode: '49-9021.00', overlapPercent: 65, direction: 'lateral' },
  ],
  '47-2152.00': [ // Plumber
    { title: 'Plumbing Supervisor', onetCode: '47-1011.01', overlapPercent: 90, direction: 'up' },
    { title: 'Pipefitter', onetCode: '47-2152.01', overlapPercent: 82, direction: 'lateral' },
    { title: 'Sprinkler Fitter', onetCode: '47-2152.02', overlapPercent: 70, direction: 'lateral' },
  ],
}

/** Default adjacent careers when no specific data exists */
const DEFAULT_ADJACENT = [
  { title: 'Site Supervisor', onetCode: '47-1011.00', overlapPercent: 80, direction: 'up' as const },
  { title: 'Safety Coordinator', onetCode: '29-9011.00', overlapPercent: 65, direction: 'lateral' as const },
  { title: 'Quality Inspector', onetCode: '47-4011.00', overlapPercent: 60, direction: 'lateral' as const },
]

export function CareerPathWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: occupationStatus, isLoading: occLoading } = useOccupationStatus()
  const { data: riasecStatus, isLoading: riasecLoading } = useRIASECStatus()

  if (occLoading || riasecLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  // Only show if user has career profile
  if (!riasecStatus?.isCompleted) {
    return null
  }

  const targetOccupations = occupationStatus?.occupations ?? []
  const primaryCode = targetOccupations[0]?.onet_code
  const adjacentCareers = primaryCode ? (ADJACENT_CAREERS[primaryCode] ?? DEFAULT_ADJACENT) : DEFAULT_ADJACENT

  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Career Paths" />

      <Stack gap={8}>
        {adjacentCareers.map((career) => (
          <Pressable
            key={career.onetCode}
            onPress={() => router.push(ROUTES.ASSESSMENTS.CAREER_EXPLORER.DETAIL.path.replace(':onetCode', career.onetCode))}
          >
            <Row
              gap={10}
              align="center"
              padding="sm"
              style={{
                backgroundColor: colors.bg[theme].subtle,
                borderRadius: 8,
              }}
            >
              <Stack
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: career.direction === 'up'
                    ? `${colors.success[500]}20`
                    : `${colors.blue[500]}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {career.direction === 'up' ? (
                  <TrendingUp size={16} color={colors.success[500]} />
                ) : (
                  <ArrowRight size={16} color={colors.blue[500]} />
                )}
              </Stack>
              <Stack style={{ flex: 1 }}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>
                  {career.title}
                </Text>
                <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                  {career.direction === 'up' ? 'Advancement' : 'Lateral move'}
                </Text>
              </Stack>
              <Stack
                style={{
                  backgroundColor: colors.bg[theme].default,
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderWidth: 1,
                  borderColor: colors.border[theme].default,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                  {career.overlapPercent}% overlap
                </Text>
              </Stack>
            </Row>
          </Pressable>
        ))}
      </Stack>
    </DashboardWidget>
  )
}
