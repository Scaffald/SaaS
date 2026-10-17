import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  H3,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'
import {
  entryActionLabel,
  entryActionRoute,
  splitRecommended,
  useAssessmentCatalogue,
} from '../assessment-catalogue'

/**
 * The assessments hub: one recommendation, then the rest on hairlines.
 *
 * It was four marketing cards — a title, a paragraph, a full-width filled
 * button each — and no indication anywhere of which ones the viewer had
 * already done (#831). Then it was a list with status, but under a status
 * strip and a search box with a count, for four items, each with its own
 * filled "Begin": four equal primaries and nothing recommended (#1193).
 *
 * Now the first assessment not yet taken leads, in its own card with the
 * screen's one primary action. Everything else is a ruled list with outline
 * actions. No search or partition: four rows do not need finding.
 */
export function AssessmentsHub() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { entries, isLoading } = useAssessmentCatalogue()

  if (isLoading) {
    return (
      <SkeletonGroup gap={16} animation="wave">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="100%" height={24} borderRadius={4} />
        ))}
      </SkeletonGroup>
    )
  }

  const { recommended, rest } = splitRecommended(entries)

  return (
    <Stack gap={24}>
      {recommended ? (
        <Stack gap={12}>
          <H3 style={{ color: colors.text[t].primary }}>Recommended for you</H3>
          <Card bordered radius="md" padding="lg" borderColor={colors.border[t].attention}>
            <Stack gap={10}>
              <Text
                style={{
                  fontSize: fontSize.h6,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: colors.text[t].attention,
                }}
              >
                {recommended.estimate}
              </Text>
              <Text size="lg" weight="semibold" style={{ color: colors.text[t].primary }}>
                {recommended.title}
              </Text>
              <Text style={{ color: colors.text[t].secondary }}>{recommended.proves}</Text>
              <Row paddingTop={6}>
                <Button
                  size="md"
                  variant="filled"
                  color="primary"
                  onPress={() => router.push(recommended.route as never)}
                >
                  Begin assessment
                </Button>
              </Row>
            </Stack>
          </Card>
        </Stack>
      ) : (
        <Text style={{ color: colors.text[t].secondary }}>
          You've taken all of them. Review your results, or take one again when things change.
        </Text>
      )}

      {rest.length > 0 && (
        <Stack style={{ borderTopWidth: 1, borderTopColor: colors.border[t].default }}>
          {rest.map((entry) => (
            <Row
              key={entry.key}
              gap={12}
              align="center"
              wrap
              paddingVertical={14}
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
            >
              <Stack gap={2} flex={1} minWidth={220}>
                <Row gap={8} align="center" wrap>
                  <Text style={{ color: colors.text[t].primary }}>{entry.title}</Text>
                  <Text
                    style={{
                      color: entry.complete ? colors.fg[t].success : colors.text[t].tertiary,
                    }}
                  >
                    {entry.complete ? 'Completed' : 'Not taken'}
                  </Text>
                </Row>
                <Text style={{ color: colors.text[t].secondary }}>{entry.proves}</Text>
                <Text style={{ color: colors.text[t].tertiary }}>{entry.estimate}</Text>
              </Stack>
              <Button
                size="sm"
                variant="outline"
                color="primary"
                onPress={() => router.push(entryActionRoute(entry) as never)}
              >
                {entryActionLabel(entry)}
              </Button>
            </Row>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
