import { ScrollView, YStack, getTokens } from '@app/ui'
import { useSafeAreaInsets } from '@app/core/utils/useSafeAreaInsets'

import { ProfileLayout } from './profile-layout'
import { useProfileDetails } from './hooks/useProfileDetails'

export function ProfileScreen() {
  const { top, bottom } = useSafeAreaInsets()
  const tokens = getTokens()
  const verticalPadding = tokens.space['$5'].val
  const { avatarUrl, profile } = useProfileDetails()

  return (
    <ScrollView
      flex={1}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: top + verticalPadding,
        paddingBottom: bottom + verticalPadding,
      }}
    >
      <YStack flex={1} gap="$6">
        <ProfileLayout avatarUrl={avatarUrl} fullName={profile?.name ?? undefined} />
      </YStack>
    </ScrollView>
  )
}
