import { Separator, Stack, useResponsive } from '@scaffald/ui'
import { AppleRelayBanner } from '@scf/core/features/auth/components/AppleRelayBanner'
import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import {
  AnalyticsWidget,
  AssessmentsSection,
  CommunitiesWidget,
  CompactNewsWidget,
  ProfileStrengthSection,
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
 * Now: profile strength and the sections that make it up, then whatever is
 * waiting on the worker (invitations), then assessments, then what has been
 * happening. Hairlines between them, one section gap, no cards. The phone
 * gets the same column with the same order rather than a different subset —
 * `DashboardIndexRight` is desktop-only and holds the reading material.
 */
export function DashboardIndexLeft() {
  const { isMobile } = useResponsive()

  return (
    <Stack gap={24}>
      <AppleRelayBanner />
      <ProfileStrengthSection />
      <Separator />
      <TeamInvitationsWidget />
      <InquiryOverviewWidget />
      <Separator />
      <AssessmentsSection />
      <Separator />
      <RecentActivityWidget />
      <Separator />
      <AnalyticsWidget />
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
