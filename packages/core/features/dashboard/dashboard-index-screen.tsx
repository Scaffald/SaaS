import { FullscreenSpinner, View } from '@app/ui'

import { useUser } from '@app/core/utils/useUser'
import { DashboardIndexLeft } from './dashboard-index-left'
import { DashboardIndexRight } from './dashboard-index-right'

export function DashboardIndexScreen() {
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
      <DashboardIndexLeft />
      <DashboardIndexRight />
    </>
  )
}
