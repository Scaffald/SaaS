import { ProfileLayout } from './layout.web'
import { ProfileOverviewScreen } from './profile-overview-screen'
import { useProfileDetails } from './hooks/useProfileDetails'

export function ProfileScreen() {
  const { avatarUrl, profile } = useProfileDetails()

  return (
    <ProfileLayout avatarUrl={avatarUrl} fullName={profile?.name ?? undefined}>
      <ProfileOverviewScreen />
    </ProfileLayout>
  )
}
