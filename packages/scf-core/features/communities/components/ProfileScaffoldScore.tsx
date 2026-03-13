import { Text, Stack, Row, DashboardWidget, H4 } from '@scaffald/ui'
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
            <Text color="$gray11" style={{ fontSize: 11 }}>
              Community reputation based on posts, ratings, and peer feedback
            </Text>
          </Stack>
        </Row>
      </Stack>
    </DashboardWidget>
  )
}
