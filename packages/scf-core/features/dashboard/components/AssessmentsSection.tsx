import { ROUTES } from '@scf/core/constants/routes'
import { useIPIPStatus } from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useOccupationStatus, useRIASECStatus } from '@scf/core/utils/onet-sdk-hooks'
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
 * There are three assessments and there always have been. So the unfinished
 * one leads as a row with its action, and the others are listed under it.
 */

type AssessmentRow = {
  id: string
  title: string
  description: string
  route: string
  complete: boolean
}

function useAssessments(): { rows: AssessmentRow[]; isLoading: boolean } {
  const { data: ipipData, isLoading: loadingIPIP } = useIPIPStatus()
  const { data: riasecData, isLoading: loadingRIASEC } = useRIASECStatus()
  const { data: occupationData, isLoading: loadingOcc } = useOccupationStatus()

  const isLoading = loadingIPIP || loadingRIASEC || loadingOcc
  if (isLoading) return { rows: [], isLoading: true }

  // These hooks may wrap data in { data: ... } or return the status directly.
  const ipipCompleted =
    !!(ipipData as { data?: { isCompleted?: boolean } })?.data?.isCompleted ||
    !!(ipipData as { isCompleted?: boolean })?.isCompleted
  const riasecCompleted =
    !!(riasecData as { isCompleted?: boolean })?.isCompleted ||
    !!(riasecData as { complete?: boolean })?.complete
  const occupationCompleted =
    !!(occupationData as { isCompleted?: boolean })?.isCompleted ||
    !!(occupationData as { selected?: boolean })?.selected

  return {
    isLoading: false,
    rows: [
      {
        id: 'ipip',
        title: 'Personality profile',
        description: 'How you work, across the five traits employers ask about.',
        route: ipipCompleted
          ? ROUTES.DASHBOARD.ASSESSMENTS.IPIP.RESULTS.path
          : ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path,
        complete: ipipCompleted,
      },
      {
        id: 'riasec',
        title: 'Career interests',
        description: 'The kind of work that suits you, matched to real occupations.',
        route: ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path,
        complete: riasecCompleted,
      },
      {
        id: 'occupation',
        title: 'Occupation preferences',
        description: 'The trades you want, ranked — this is what job matching reads.',
        route: ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.path,
        complete: occupationCompleted,
      },
    ],
  }
}

export function AssessmentsSection() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { rows, isLoading } = useAssessments()

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
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(ROUTES.DASHBOARD.ASSESSMENTS.path)}
        >
          See all
        </Button>
      }
    >
      <Text style={{ color: colors.text[t].secondary }}>
        {done === rows.length
          ? 'All three are done. They feed your job matches and career recommendations.'
          : `${done} of ${rows.length} done. Finished assessments unlock job matching and career recommendations.`}
      </Text>

      <Stack>
        {rows.map((row) => (
          <Row
            key={row.id}
            gap={12}
            align="center"
            wrap
            paddingVertical={12}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
          >
            <Stack gap={2} flex={1} minWidth={200}>
              <Row gap={8} align="center" wrap>
                <Text style={{ color: colors.text[t].primary }}>{row.title}</Text>
                {row.id === nextUp?.id ? (
                  <Text style={{ color: colors.text[t].attention }}>Next up</Text>
                ) : row.complete ? (
                  <Text style={{ color: colors.fg[t].success }}>Done</Text>
                ) : null}
              </Row>
              <Text style={{ color: colors.text[t].secondary }}>{row.description}</Text>
            </Stack>
            <Button
              size="sm"
              variant={row.id === nextUp?.id ? 'filled' : 'outline'}
              color="primary"
              onPress={() => router.push(row.route)}
            >
              {row.complete ? 'View results' : 'Start'}
            </Button>
          </Row>
        ))}
      </Stack>
    </HomeSection>
  )
}
