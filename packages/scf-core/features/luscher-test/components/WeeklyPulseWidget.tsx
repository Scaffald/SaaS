import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Row,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES } from '@scf/core/constants/routes'
import {
  useAssessmentStatus,
  useLuscherTestAvailability,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import type { AssessmentStatus } from '@scaffald/sdk/resources/personality-assessment'
import { colorChoices } from '@scf/core/features/personality-assessment/lib/luscher/utils'

/**
 * Color index → hex mapping from the standard Luscher order.
 * MainColor enum: 0=GRAY, 1=BLUE, 2=GREEN, 3=RED, 4=YELLOW, 5=PURPLE, 6=BROWN, 7=BLACK
 */
const COLOR_INDEX_HEX: Record<number, string> = {}
for (const c of colorChoices()) {
  COLOR_INDEX_HEX[c.value] = c.hex
}

function formatTimeRemaining(nextAvailableAt: string): string {
  const diff = new Date(nextAvailableAt).getTime() - Date.now()
  if (diff <= 0) return 'Available now'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `Available in ${days}d ${hours}h`
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `Available in ${hours}h ${minutes}m`
  return `Available in ${minutes}m`
}

function ColorDot({ hex, size = 20 }: { hex: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: hex,
      }}
    />
  )
}

/**
 * WeeklyPulseWidget — Dashboard widget for the Weekly Pulse (Luscher Color Test).
 *
 * Three states:
 * - Loading: spinner
 * - Available: CTA to take assessment with color dots teaser
 * - Results: top 4 color preference dots + next available countdown
 */
export function WeeklyPulseWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { data: assessmentData, isLoading: statusLoading } = useAssessmentStatus()
  const { data: availabilityData, isLoading: availabilityLoading } =
    useLuscherTestAvailability()

  // SDK data unwrapping — API returns AssessmentStatus directly, not { data: AssessmentStatus }
  const assessment = assessmentData
    ? ((assessmentData as { data?: AssessmentStatus }).data ??
        (assessmentData as unknown as AssessmentStatus))
    : undefined

  const availability = availabilityData
    ? ((availabilityData as { data?: { isOnCooldown: boolean; nextAvailableAt: string | null } })
        .data ??
        (availabilityData as unknown as {
          isOnCooldown: boolean
          nextAvailableAt: string | null
        }))
    : undefined

  const hasCompletedChoices =
    assessment?.luscher1_choices &&
    assessment.luscher1_choices.length > 0 &&
    assessment?.luscher2_choices &&
    assessment.luscher2_choices.length > 0

  // Live countdown update
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!availability?.nextAvailableAt || !availability.isOnCooldown) return
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [availability?.nextAvailableAt, availability?.isOnCooldown])

  const isLoading = statusLoading || availabilityLoading

  const navigateToPulse = () => {
    router.push(ROUTES.ASSESSMENTS.LUSCHER.path as never)
  }

  // All 8 Luscher colors for the teaser row
  const allColors = colorChoices()

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  // Results state — user has completed the test
  if (hasCompletedChoices) {
    const top4 = (assessment.luscher1_choices ?? [])
      .slice(0, 4)
      .map((idx) => COLOR_INDEX_HEX[idx])
      .filter(Boolean)

    const isAvailableNow =
      !availability?.isOnCooldown ||
      (availability?.nextAvailableAt &&
        new Date(availability.nextAvailableAt).getTime() <= Date.now())

    return (
      <DashboardWidget>
        <DashboardWidgetHeader
          title="Weekly Pulse"
          action={
            <Button variant="outline" size="sm" onPress={navigateToPulse}>
              View Details
            </Button>
          }
        />
        <Stack gap={16}>
          {/* Top 4 color preference */}
          <Stack gap={8}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.text[theme].secondary,
              }}
            >
              Your Color Preferences
            </Text>
            <Row gap={10} align="center">
              {top4.map((hex, i) => (
                <ColorDot key={i} hex={hex} size={28} />
              ))}
            </Row>
          </Stack>

          {/* Next available / CTA */}
          <Row align="center" justify="space-between">
            <Text
              style={{
                fontSize: 13,
                color: isAvailableNow
                  ? colors.primary[500]
                  : colors.text[theme].secondary,
                fontWeight: isAvailableNow ? '600' : '400',
              }}
            >
              {isAvailableNow
                ? 'Ready for a new pulse check!'
                : formatTimeRemaining(availability?.nextAvailableAt ?? '')}
            </Text>
            {isAvailableNow && (
              <Button variant="filled" color="primary" size="sm" onPress={navigateToPulse}>
                Retake
              </Button>
            )}
          </Row>
        </Stack>
      </DashboardWidget>
    )
  }

  // Available state — no completed test or first time
  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Weekly Pulse"
        action={
          <Button variant="filled" color="primary" size="sm" onPress={navigateToPulse}>
            Take Assessment
          </Button>
        }
      />
      <Stack gap={12}>
        {/* Color teaser row */}
        <Row gap={8} align="center" style={{ flexWrap: 'wrap' }}>
          {allColors.map((c) => (
            <ColorDot key={c.key} hex={c.hex} size={20} />
          ))}
        </Row>

        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: colors.text[theme].secondary,
          }}
        >
          A quick ~2 minute color selection to capture how you're feeling this week. Helps
          coaches tailor guidance to your current state.
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
