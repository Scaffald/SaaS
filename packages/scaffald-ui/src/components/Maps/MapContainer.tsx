/**
 * MapContainer – wrapper for map content. No map library dependency.
 * Apps render the actual map (Mapbox, Google, Leaflet) as children or via an adapter.
 */

import { View } from 'react-native'
import type { MapContainerProps } from './Maps.types'

const DEFAULT_MIN_HEIGHT = 300

export function MapContainer({
  children,
  style,
  minHeight = DEFAULT_MIN_HEIGHT,
}: MapContainerProps) {
  return (
    <View
      style={[{ minHeight, overflow: 'hidden' }, style]}
      accessibilityRole="image"
      accessibilityLabel="Map container"
    >
      {children}
    </View>
  )
}
