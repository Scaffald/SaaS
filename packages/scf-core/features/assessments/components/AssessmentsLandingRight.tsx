import { Card, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'

/**
 * The hub's rail: one short card, to the worker, about why.
 *
 * It was four headed paragraphs addressed to "coaches, managers, and
 * teammates", promising summaries in "your dossier and team dashboards" —
 * neither of which a worker has (#1193). The prototype's rail is a small
 * "Why this matters" card; its figure ("3.2× more searches") has no source
 * here, so the card says what is true instead.
 */
export const AssessmentsLandingRight = () => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Card bordered radius="md" padding="lg">
      <Stack gap={10}>
        <Text
          style={{
            fontSize: fontSize.h6,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: colors.text[t].attention,
          }}
        >
          Why this matters
        </Text>
        <Text style={{ color: colors.text[t].primary }}>
          Employers see the assessments you've finished on your profile, and job matching reads your
          occupation preferences. Each one answers a question before anyone has to ask it.
        </Text>
        <Text style={{ color: colors.text[t].tertiary, fontStyle: 'italic' }}>
          You can take any of them again when things change.
        </Text>
      </Stack>
    </Card>
  )
}
