import {
  DashboardWidget,
  ProgressBarBase,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useProfileCompletion } from './useProfileCompletion'

/**
 * ProfileStrengthCard
 *
 * Slim "Profile Strength" surface — header + Beginner/Intermediate/Advanced
 * label badge + completion percentage + progress bar. No identity row, no
 * action CTAs. Drop into any screen that wants to show profile completion
 * without duplicating identity chrome the host already renders.
 *
 * Backed by `useProfileCompletion()` so it always matches the same canonical
 * percentage rendered by ProfileHero, ProfileIdentityWidget, etc.
 *
 * For full Profile Strength widgets with section CTAs, use
 * `ProfileIdentityWidget` (dashboard) or `ProfileCompletionWidget` (checklist).
 */
function getStrengthLabel(pct: number): 'Advanced' | 'Intermediate' | 'Beginner' {
  if (pct >= 80) return 'Advanced'
  if (pct >= 50) return 'Intermediate'
  return 'Beginner'
}

export function ProfileStrengthCard() {
  const { theme } = useThemeContext()
  const { completionData, isLoading } = useProfileCompletion()

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={12} animation="wave">
          <Row justify="space-between">
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={16} />
          </Row>
          <Skeleton height={12} width="100%" borderRadius={99} />
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  const completion = completionData?.completionPercentage ?? 0
  const label = getStrengthLabel(completion)
  const badgeColor =
    completion >= 80
      ? { bg: colors.emerald[100], text: colors.emerald[700] }
      : completion >= 50
        ? { bg: colors.indigo[50], text: colors.indigo[700] }
        : { bg: colors.amber[100], text: colors.amber[700] }

  return (
    <DashboardWidget>
      <Stack
        gap={12}
        padding={16}
        borderRadius={12}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1,
          borderColor: colors.border[theme].ghost,
        }}
      >
        <Row justify="space-between" align="center">
          <Row gap={8} align="center">
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.text[theme].primary,
              }}
            >
              Profile Strength
            </Text>
            <Stack
              paddingHorizontal={8}
              paddingVertical={2}
              borderRadius={6}
              style={{ backgroundColor: badgeColor.bg }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: badgeColor.text,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </Text>
            </Stack>
          </Row>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color:
                completion >= 80
                  ? colors.emerald[700]
                  : colors.text[theme].primary,
            }}
          >
            {completion}% Complete
          </Text>
        </Row>

        <ProgressBarBase
          value={completion}
          color="primary"
          style={{ backgroundColor: colors.bg[theme].muted }}
        />
      </Stack>
    </DashboardWidget>
  )
}
