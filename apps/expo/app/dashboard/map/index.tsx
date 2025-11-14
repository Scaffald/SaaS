import { DiscoverMapScreen } from '@app/core/features/discover/discover-map-screen'
import { MapStateProvider } from '@app/core/features/discover/providers/MapStateProvider'

export default function DiscoverMapRoute() {
  return (
    <MapStateProvider>
      <DiscoverMapScreen />
    </MapStateProvider>
  )
}
