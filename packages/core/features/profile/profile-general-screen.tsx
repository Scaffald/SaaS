import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { ProfileGeneralLeft } from './profile-general-left'
import { ProfileGeneralRight } from './profile-general-right'

export function ProfileGeneralScreen() {
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
      <ProfileGeneralLeft />
      <ProfileGeneralRight />
    </>
  )
}
