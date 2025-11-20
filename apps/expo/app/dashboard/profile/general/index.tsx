import { ProfileGeneralLeft } from '@app/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@app/core/features/profile/profile-general-right'
import { ProfileLayout, QuickLinksSidebar } from '@app/ui'

export default function ProfileGeneralPage() {
  return (
    <ProfileLayout
      leftContent={<ProfileGeneralLeft />}
      rightContent={
        <QuickLinksSidebar>
          <ProfileGeneralRight />
        </QuickLinksSidebar>
      }
    />
  )
}
