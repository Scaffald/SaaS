import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { ProfileContactAvailabilityLeft } from './profile-contact-availability-left'
import { ProfileContactAvailabilityRight } from './profile-contact-availability-right'

export function ProfileContactAvailabilityScreen() {
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
      <ProfileContactAvailabilityLeft />
      <ProfileContactAvailabilityRight />
    </>
  )
}
