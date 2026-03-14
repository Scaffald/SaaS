import { Text, Stack, Row, DashboardWidget, H4, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useUserScaffoldScore } from '@scf/core/utils/communities-sdk-hooks'
import { ScaffoldScoreBadge } from './ScaffoldScoreBadge'

interface Props {
  userId: string
}

/**
 * ProfileScaffoldScore — Shows a user's Scaffold Score on their profile.
 * Displays the circular badge with score and a brief description.
 */
export function ProfileScaffoldScore({ userId }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data } = useUserScaffoldScore(userId)

  if (!data?.data) {
    return null
  }

  const { score } = data.data

  return (
    <DashboardWidget>
      <Stack gap={12}>
        <H4>Scaffold Score</H4>
        <Row align="center" gap={16}>
          <ScaffoldScoreBadge score={score} size={64} />
          <Stack gap={4} style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 15 }}>{score}/100</Text>
            <Text style={{ fontSize: 11, color: colors.text[t].secondary }}>
              Community reputation based on posts, ratings, and peer feedback
            </Text>
          </Stack>
        </Row>
      </Stack>
    </DashboardWidget>
  )
}
