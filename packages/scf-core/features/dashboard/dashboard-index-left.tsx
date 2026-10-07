import { Separator, Stack, useResponsive } from '@scaffald/ui'
import { AppleRelayBanner } from '@scf/core/features/auth/components/AppleRelayBanner'
import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import {
  AssessmentsSection,
  BuildProfileBlock,
  CommunitiesWidget,
  CompactNewsWidget,
  HomeMetrics,
  RecentActivityWidget,
  TeamInvitationsWidget,
} from './components'

/**
 * Home, as one reading column of bands.
 *
 * It was eight cards on a gradient — a profile hero, an auto-advancing tip
 * carousel, an assessments carousel, and five more widgets, each its own box
 * with its own heading size, and a different set of them on the phone than
 * on the desktop. Every block had the same visual weight, so the screen said
 * nothing about what to do first.
 *
 * Then (#1033): the greeting moved into the shared ScreenHeader, the figures
 * (search appearances, profile views, invitations) open the column, and the
 * profile checklist shrank to one block that disappears once the profile is
 * complete. On a desktop that block sits in the right rail, as in the
 * prototype; on a phone it follows the figures. After that: whatever is
 * waiting on the worker, assessments, then what has been happening. The
 * phone gets the same column in the same order rather than a different
 * subset. `DashboardIndexRight` is desktop-only.
 */
export function DashboardIndexLeft() {
  const { isMobile } = useResponsive()

  return (
    <Stack gap={24}>
      <AppleRelayBanner />
      <HomeMetrics />
      {isMobile ? <BuildProfileBlock /> : null}
      <TeamInvitationsWidget />
      <InquiryOverviewWidget />
      {/* No rule here: the metric row draws its own hairline beneath it, and
          with no invitations a Separator sat directly under that one. */}
      <AssessmentsSection />
      <Separator />
      <RecentActivityWidget />
      {/* On a phone there is no second column, so the reading material that
          lives there on a desktop comes back here rather than disappearing. */}
      {isMobile ? (
        <>
          <Separator />
          <CommunitiesWidget />
          <Separator />
          <CompactNewsWidget />
        </>
      ) : null}
    </Stack>
  )
}
