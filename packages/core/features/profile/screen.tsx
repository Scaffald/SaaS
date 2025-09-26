import { ProfileLayout } from './layout.web'
import { useProfileDetails } from './hooks/useProfileDetails'
import { ProfileOverviewContent } from './profile-overview-content'

export function ProfileScreen() {
  const { avatarUrl, profile } = useProfileDetails()

  return (
    <ProfileLayout avatarUrl={avatarUrl} fullName={profile?.name ?? undefined}>
      <ProfileOverviewContent />
    </ProfileLayout>
  )
}
