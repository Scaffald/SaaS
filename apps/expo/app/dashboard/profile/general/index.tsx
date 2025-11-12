import { ProfileGeneralLeft } from '@app/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@app/core/features/profile/profile-general-right'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileGeneralPage() {
  return (
    <DashboardLayout
      leftContent={<ProfileGeneralLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileGeneralRight />
        </QuickLinksSidebar>
      }
    />
  )
}
