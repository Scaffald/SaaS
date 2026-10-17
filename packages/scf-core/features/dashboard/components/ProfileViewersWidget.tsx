import { useProfileViews } from '@scf/core/utils/profile-views-sdk-hooks'
import {
  EmptyState,
  ErrorState,
  Row,
  Separator,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { borderRadius, colors, fontSize } from '@scaffald/ui/tokens'
import { Eye } from 'lucide-react-native'
import { Fragment } from 'react'
import { toProfileViewerRow } from '../home-activity-rows'
import { HomeSection } from './HomeSection'

const VIEWER_LIMIT = 5

/**
 * "Who viewed your profile" — the names behind Home's profile-views figure.
 *
 * Recent activity already fetched these views and threw the rows away,
 * printing the all-time total as "You appeared in N searches this week":
 * views, not searches, and not this week (#1172). The prototype puts the
 * viewers under the invitations as hairline rows, so a worker can see who
 * is looking rather than only how many.
 */
export function ProfileViewersWidget() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data, isLoading, error, refetch } = useProfileViews({ limit: VIEWER_LIMIT })

  if (isLoading) {
    return (
      <SkeletonGroup gap={16} animation="wave">
        <Skeleton width={180} height={18} borderRadius={borderRadius.xs} />
        {[1, 2, 3].map((i) => (
          <Row key={i} justify="space-between" align="center" gap={12}>
            <Stack gap={4} flex={1}>
              <Skeleton width="50%" height={12} />
              <Skeleton width="70%" height={10} />
            </Stack>
            <Skeleton width={60} height={10} />
          </Row>
        ))}
      </SkeletonGroup>
    )
  }

  if (error) {
    return (
      <HomeSection title="Who viewed your profile">
        <ErrorState
          title="Couldn't load your profile views"
          error={error instanceof Error ? error : String(error)}
          retry={() => void refetch()}
        />
      </HomeSection>
    )
  }

  const rows = (data?.views ?? []).slice(0, VIEWER_LIMIT).map(toProfileViewerRow)

  return (
    <HomeSection title="Who viewed your profile">
      {rows.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No profile views yet"
          description="When someone opens your profile, they'll show up here."
        />
      ) : (
        <Stack>
          {rows.map((row, i) => (
            <Fragment key={row.id}>
              {i > 0 ? <Separator /> : null}
              <Row justify="space-between" align="center" gap={12} paddingVertical={10}>
                <Stack gap={2} flex={1} minWidth={0}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: fontSize.md,
                      fontWeight: '600',
                      color: colors.text[t].primary,
                    }}
                  >
                    {row.who}
                  </Text>
                  {row.detail ? (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: fontSize.sm, color: colors.text[t].secondary }}
                    >
                      {row.detail}
                    </Text>
                  ) : null}
                </Stack>
                <Text style={{ fontSize: fontSize.xs, color: colors.text[t].tertiary }}>
                  {row.when}
                </Text>
              </Row>
            </Fragment>
          ))}
        </Stack>
      )}
    </HomeSection>
  )
}
