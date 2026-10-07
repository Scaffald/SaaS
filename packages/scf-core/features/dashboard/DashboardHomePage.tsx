import { Button, Row } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { ROUTES } from '@scf/core/constants/routes'
import { useEngagementMetrics } from '@scf/core/utils/engagement-sdk-hooks'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { useUser } from '@scf/core/utils/useUser'
import { DashboardPage } from './DashboardPage'
import { DashboardIndexLeft } from './dashboard-index-left'
import { DashboardIndexRight } from './dashboard-index-right'
import { useProfileCompletion } from './completion/useProfileCompletion'

/**
 * Worker home (#1033).
 *
 * The prototype opens on a greeting: the date as a kicker, "Good morning,
 * <name>.", one line about what is happening, and then the figures. Home
 * opened instead on a name-and-avatar row and a profile checklist with no
 * page header at all, so for a worker with a finished profile the first
 * screen was a list of chores already done.
 *
 * Everything said here is read from data the screen already loads: the name
 * from the general-info widget, the search count from engagement metrics,
 * completion from the same hook the checklist reads. No Scaffald score —
 * there is no server aggregate for one yet (#632), and a made-up number in
 * the most prominent spot on the page is the worst place to make one up.
 */
export function DashboardHomePage() {
  const header = useHomeHeader()

  return (
    <DashboardPage
      showBreadcrumb={false}
      screenKicker={header.kicker}
      screenTitle={header.title}
      screenTip={header.tip}
      screenActions={header.actions}
      leftContent={<DashboardIndexLeft />}
      rightContent={<DashboardIndexRight />}
    />
  )
}

function partOfDay(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function useHomeHeader() {
  const router = useRouter()
  const { user } = useUser()
  const { data: profile } = useGeneralInfoWidget()
  const { data: metrics } = useEngagementMetrics({ days: 30 })
  const { completionData } = useProfileCompletion()

  // Local time on purpose: this is the reader's own day, not a stored date.
  // Protected routes render behind the client-side auth gate, so there is no
  // server render of this header for the client to disagree with.
  const now = new Date()
  const kicker = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const sessionName =
    typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : undefined
  const name = profile?.display_name ?? sessionName
  const firstName = name?.trim().split(/\s+/)[0]
  const title = firstName ? `${partOfDay(now.getHours())}, ${firstName}.` : `${partOfDay(now.getHours())}.`

  const searches = metrics?.searches ?? 0
  const total = completionData?.totalItems ?? 0
  const incomplete = total > 0 && (completionData?.totalComplete ?? 0) < total
  const found =
    searches > 0
      ? `Employers found you ${searches.toLocaleString()} ${searches === 1 ? 'time' : 'times'} in search this month.`
      : null
  const tip = found
    ? incomplete
      ? `${found} Finishing your profile puts you in front of more of them.`
      : found
    : incomplete
      ? 'Finish your profile so employers searching for your trade can find you.'
      : 'Your profile is complete. Keep it current and employers searching your trade will find you.'

  const slug = profile?.slug
  const actions = (
    <Row gap={8} wrap>
      <Button size="sm" variant="outline" onPress={() => router.push(ROUTES.PROFILE.path)}>
        Edit profile
      </Button>
      {slug ? (
        <Button size="sm" variant="outline" onPress={() => openPublicProfileInNewTab(slug)}>
          View public profile
        </Button>
      ) : null}
    </Row>
  )

  return { kicker, title, tip, actions }
}
