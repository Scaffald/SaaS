/**
 * Persistent notice that the surrounding screen renders fabricated data.
 *
 * Several office screens were built against mock constants while the backing
 * API was still missing, and nothing on screen distinguished them from screens
 * showing real records. This makes that distinction unmissable — and survives
 * into a screenshot, which is how these screens tend to travel.
 *
 * Deliberately not dismissible. A notice a user can close is a notice that is
 * absent from the screenshot they send someone else.
 *
 * Each caller keeps its own `USES_SAMPLE_DATA` flag so that deleting the flag
 * is the last step of wiring that screen to real data.
 */

import { Card, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { AlertTriangle } from 'lucide-react-native'

export interface SampleDataNoticeProps {
  /** Headline. Say what the screen is *not*, not just that data is fake. */
  title: string
  /** What the reader must not do with these figures, and why they are here. */
  description: string
}

export function SampleDataNotice({ title, description }: SampleDataNoticeProps) {
  const { theme } = useThemeContext()

  return (
    <Card
      variant="glass"
      padding="md"
      style={{
        backgroundColor: theme === 'dark' ? colors.warning[900] : colors.warning[50],
        borderWidth: 1,
        borderColor: colors.fg[theme].warning,
      }}
    >
      <Row gap={12} align="center">
        <AlertTriangle size={24} color={colors.fg[theme].warning} />
        <Stack flex={1} gap={2}>
          <Text style={{ fontWeight: '700', color: colors.fg[theme].warning }}>{title}</Text>
          <Text style={{ fontSize: 13, color: colors.fg[theme].warning }}>{description}</Text>
        </Stack>
      </Row>
    </Card>
  )
}
