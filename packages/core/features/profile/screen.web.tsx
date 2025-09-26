import { ScrollView, getTokens, useMedia } from '@app/ui'

import { EditProfileScreen } from './edit-screen'
import { ProfileLayout } from './profile-layout'
import { useProfileDetails } from './hooks/useProfileDetails'

export function ProfileScreen() {
  const tokens = getTokens()
  const media = useMedia()
  const verticalPadding = tokens.space['$6'].val
  const { avatarUrl, profile } = useProfileDetails()

  if (media.gtSm) {
    return (
      <ScrollView
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingTop: verticalPadding,
          paddingBottom: verticalPadding,
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <EditProfileScreen onSuccess={() => {}} />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      flex={1}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
      }}
    >
      <ProfileLayout avatarUrl={avatarUrl} fullName={profile?.name ?? undefined} />
    </ScrollView>
  )
}
