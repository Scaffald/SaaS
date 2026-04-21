import { InquiryOverviewWidget } from '@scf/core/features/inquiries/components/InquiryOverviewWidget'
import { Stack, useResponsive } from '@scaffald/ui'
import { CommunitiesWidget } from './CommunitiesWidget'
import { CompactNewsWidget } from './CompactNewsWidget'

/**
 * Mobile dashboard content stack.
 * Assessments, Recent Activity, and Weekly Growth Tip are intentionally
 * omitted on mobile and render on desktop via DashboardIndexRight.
 */
export function MobileDashboardTabs() {
  const { isMobile } = useResponsive()

  if (!isMobile) return null

  return (
    <Stack gap={12}>
      <InquiryOverviewWidget />
      <CommunitiesWidget />
      <CompactNewsWidget />
    </Stack>
  )
}
