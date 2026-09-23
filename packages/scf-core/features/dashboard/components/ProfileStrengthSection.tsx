import { useRouter } from 'expo-router'
import { Button, MetricBlock, MetricRow, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Avatar } from '@scaffald/ui'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { useProfileCompletion } from '../completion/useProfileCompletion'

/**
 * Profile strength, as a figure and the rows that make it up.
 *
 * Home opened with a card holding a name, an avatar, a percentage, a
 * progress bar and a horizontally-scrolling strip of four buttons — and then
 * a second card, auto-advancing every eight seconds, telling the worker one
 * thing at a time about the same profile. The number and the reasons for it
 * were in different boxes, and the reasons arrived on a timer.
 *
 * The figure is a `MetricBlock`, the same block every other screen uses for a
 * number. Its inputs are bands: one hairline row per section the backend
 * already scores (#585), each saying what it is, whether it is done, what it
 * is for, and where to go. No new scoring — `useProfileCompletion` is the
 * same source the old card read its percentage from.
 *
 * Incomplete sections come first. A worker looking at this screen is looking
 * for what to do next, and eleven green rows above the one red one is not an
 * answer.
 */
export function ProfileStrengthSection() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data: profile } = useGeneralInfoWidget()
  const { user } = useUser()
  const { completionData, isLoading } = useProfileCompletion()

  // `/profiles/widgets/general-info` returns `display_name`; the old hero
  // read `privateData.first_name` first, a field the endpoint has never
  // returned, so that branch was dead and the fallback did the work.
  //
  // The session's own metadata is the last resort. A signed-in worker
  // greeted as "Your profile" reads as a broken session rather than a slow
  // one, and the name is already in hand without waiting on a request.
  const sessionName =
    typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined
  const fullName =
    profile?.display_name ?? profile?.username ?? sessionName ?? user?.email ?? 'Your profile'
  const initials =
    fullName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  const slug = profile?.slug

  const percentage = completionData?.completionPercentage ?? 0
  const done = completionData?.totalComplete ?? 0
  const total = completionData?.totalItems ?? 0

  // Unfinished first, then the rest in the backend's own order. Within the
  // unfinished, heavier sections lead — weight is what the score actually
  // responds to, so it is the honest ordering of "do this next".
  const bands = [...(completionData?.items ?? [])].sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1
    if (a.complete) return 0
    return (b.weight ?? 0) - (a.weight ?? 0)
  })

  return (
    <Stack gap={20}>
      <Row gap={16} align="center" wrap>
        <Avatar
          size={56}
          src={profile?.avatar_url ?? undefined}
          initials={initials}
          color="gray"
          alt={fullName}
        />
        <Stack gap={4} flex={1} minWidth={160}>
          <Text style={{ color: colors.text[t].primary }}>{fullName}</Text>
          <Row gap={16} wrap>
            <Text
              style={{ color: colors.text[t].emphasis }}
              onPress={() => router.push(ROUTES.PROFILE.path)}
            >
              Edit profile
            </Text>
            {slug ? (
              <Text
                style={{ color: colors.text[t].emphasis }}
                onPress={() => openPublicProfileInNewTab(slug)}
              >
                View public profile
              </Text>
            ) : null}
          </Row>
        </Stack>
      </Row>

      <MetricRow bordered>
        <MetricBlock
          label="Profile strength"
          value={`${percentage}%`}
          delta={total > 0 ? `${done} of ${total} sections done` : undefined}
        />
        <MetricBlock
          label="Left to do"
          value={total > 0 ? `${total - done}` : '—'}
          delta={total > 0 && done === total ? 'Nothing outstanding' : 'Sections below'}
          emphasis={total > 0 && done < total}
        />
      </MetricRow>

      {isLoading ? (
        <Text style={{ color: colors.text[t].secondary }}>Working out your profile strength…</Text>
      ) : bands.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary }}>
          We couldn't read your profile sections just now.
        </Text>
      ) : (
        <Stack>
          {bands.map((band) => (
            <Row
              key={band.id}
              gap={12}
              align="center"
              wrap
              paddingVertical={12}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.border[t].default,
              }}
            >
              <Stack gap={2} flex={1} minWidth={200}>
                <Row gap={8} align="center" wrap>
                  <Text style={{ color: colors.text[t].primary }}>{band.title}</Text>
                  <Text
                    style={{
                      color: band.complete ? colors.fg[t].success : colors.text[t].attention,
                    }}
                  >
                    {band.complete ? 'Done' : 'Needs work'}
                  </Text>
                </Row>
                <Text style={{ color: colors.text[t].secondary }}>{band.description}</Text>
              </Stack>
              {band.actionRoute ? (
                <Button
                  size="sm"
                  variant={band.complete ? 'outline' : 'filled'}
                  color="primary"
                  onPress={() => router.push(band.actionRoute as string)}
                >
                  {band.complete ? 'Review' : 'Add'}
                </Button>
              ) : null}
            </Row>
          ))}
        </Stack>
      )}

      <Row gap={8} wrap>
        <Button size="sm" variant="outline" onPress={() => router.push(buildPath(ROUTES.JOBS, {}))}>
          Find jobs
        </Button>
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(buildPath(ROUTES.PROFILE.RESUME, {}))}
        >
          My resume
        </Button>
        <Button size="sm" variant="outline" onPress={() => router.push(ROUTES.ASSESSMENTS.path)}>
          Assessments
        </Button>
        <Button
          size="sm"
          variant="outline"
          onPress={() => router.push(ROUTES.EMPLOYERS.TEAMS.path)}
        >
          Teams
        </Button>
      </Row>
    </Stack>
  )
}
