import { ScrollView, getTokens } from '@my/ui'

import { ProfileLayout } from './profile-layout'

export function ProfileScreen() {
  const tokens = getTokens()
  const verticalPadding = tokens.space['$6'].val

  return (
    <ScrollView
      flex={1}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: verticalPadding,
        paddingBottom: verticalPadding,
      }}
    >
      <ProfileLayout />
    </ScrollView>
  )
}
