import { ROUTES } from '@scf/core/constants/routes'
import { useAssessmentCatalogue } from '@scf/core/features/assessments/assessment-catalogue'
import { Button, Row, Skeleton, SkeletonGroup, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { HomeSection } from './HomeSection'

/**
 * Assessments on Home: what to do next, then the rest.
 *
 * This was a horizontal carousel of three cards with arrows and pagination
 * dots — a control built for a long list, holding three items, on a screen
 * that scrolls vertically. Two of the three were usually the same state, and
 * the one that wanted attention could be off-screen behind an arrow.
 *
 * The list itself comes from the shared catalogue, so Home and the hub name
 * the same assessments the same way and read their completion the same way
 * (#831). Home shows the first three; the hub shows all of them.
 */
export function AssessmentsSection() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { entries, isLoading } = useAssessmentCatalogue()
  const rows = entries.slice(0, 3)

  if (isLoading) {
    return (
      <HomeSection title="Assessments">
        <SkeletonGroup gap={12} animation="wave">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={20} borderRadius={4} />
          ))}
        </SkeletonGroup>
      </HomeSection>
    )
  }

  const nextUp = rows.find((row) => !row.complete)
  const done = rows.filter((row) => row.complete).length

  return (
    <HomeSection
      title="Assessments"
      action={
        <Button size="sm" variant="outline" onPress={() => router.push(ROUTES.ASSESSMENTS.path)}>
          See all
        </Button>
      }
    >
      <Text style={{ color: colors.text[t].secondary }}>
        {done === rows.length
          ? 'All done. They feed your job matches and career recommendations.'
          : `${done} of ${rows.length} done. Finished assessments unlock job matching and career recommendations.`}
      </Text>

      <Stack>
        {rows.map((row) => (
          <Row
            key={row.key}
            gap={12}
            align="center"
            wrap
            paddingVertical={12}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
          >
            <Stack gap={2} flex={1} minWidth={200}>
              <Row gap={8} align="center" wrap>
                <Text style={{ color: colors.text[t].primary }}>{row.title}</Text>
                {row.key === nextUp?.key ? (
                  <Text style={{ color: colors.text[t].attention }}>Next up</Text>
                ) : row.complete ? (
                  <Text style={{ color: colors.fg[t].success }}>Done</Text>
                ) : null}
              </Row>
              <Text style={{ color: colors.text[t].secondary }}>{row.proves}</Text>
            </Stack>
            <Button
              size="sm"
              variant={row.key === nextUp?.key ? 'filled' : 'outline'}
              color="primary"
              onPress={() =>
                router.push(row.complete && row.resultsRoute ? row.resultsRoute : row.route)
              }
            >
              {row.complete ? 'View results' : 'Start'}
            </Button>
          </Row>
        ))}
      </Stack>
    </HomeSection>
  )
}
