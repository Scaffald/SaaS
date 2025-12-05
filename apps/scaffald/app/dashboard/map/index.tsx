import { DiscoverMapScreen } from '@scf/core/features/discover/discover-map-screen'
import { MapStateProvider } from '@scf/core/features/discover/providers/MapStateProvider'

export default function DiscoverMapRoute() {
  return (
    <MapStateProvider>
      <DiscoverMapScreen />
    </MapStateProvider>
  )
}
