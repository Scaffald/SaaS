import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { ProfileSkillsLeft } from './profile-skills-left'
import { ProfileSkillsRight } from './profile-skills-right'

export function ProfileSkillsScreen() {
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
      <ProfileSkillsLeft />
      <ProfileSkillsRight />
    </>
  )
}
