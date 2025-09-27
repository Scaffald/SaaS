import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { ProfileIndexLeft } from './profile-index-left'
import { ProfileIndexRight } from './profile-index-right'

export function ProfileIndexScreen() {
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
      <ProfileIndexLeft />
      <ProfileIndexRight />
    </>
  )
}
