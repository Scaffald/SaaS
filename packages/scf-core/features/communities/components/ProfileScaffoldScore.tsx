import { Text, Stack, Row, DashboardWidget, H4, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useWorkerScore } from '@scf/core/utils/user-profiles-sdk-hooks'
import { ScaffoldScoreBadge } from './ScaffoldScoreBadge'

interface Props {
  userId: string
}

/**
 * ProfileScaffoldScore — Shows a user's Scaffald score on their profile.
 * Displays the circular badge with score and a brief description.
 *
 * The score is gamified_score, the one Find talent shows (#1355). It was the
 * community reputation figure, which starts everyone at 100.
 */
export function ProfileScaffoldScore({ userId }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { score } = useWorkerScore(userId)

  if (score == null) {
    return null
  }

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <H4>Scaffald score</H4>
        <Row align="center" gap={16}>
          <ScaffoldScoreBadge score={score} size={64} />
          <Stack gap={4} style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 15 }}>{score}/100</Text>
            <Text style={{ fontSize: 11, color: colors.text[t].secondary }}>
              Based on experience, listed skills, and availability
            </Text>
          </Stack>
        </Row>
      </Stack>
    </DashboardWidget>
  )
}
