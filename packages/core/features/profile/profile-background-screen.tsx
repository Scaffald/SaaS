import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { ProfileBackgroundLeft } from './profile-background-left'
import { ProfileBackgroundRight } from './profile-background-right'

export function ProfileBackgroundScreen() {
  const { isPending } = useUser()

  if (isPending) {
    return (
      <View flex={1} height="80vh" ai="center" jc="center">
        <FullscreenSpinner />
      </View>
    )
  }

  return (
    <>
      <ProfileBackgroundLeft />
      <ProfileBackgroundRight />
    </>
  )
}
