/**
 * MapContainer – wrapper for map content. No map library dependency.
 * Apps render the actual map (Mapbox, Google, Leaflet) as children or via an adapter.
 * Accepts extended props (pins, center, zoom, etc.) for app-level map implementations.
 */

import type React from 'react'
import { forwardRef } from 'react'
import { View } from 'react-native'
import type { MapContainerProps } from './Maps.types'

const DEFAULT_MIN_HEIGHT = 300

export const MapContainer = forwardRef<unknown, MapContainerProps>(function MapContainer(
  {
    children,
    style,
    minHeight = DEFAULT_MIN_HEIGHT,
    // Extended props for map adapters - destructure to avoid passing to View
    pins: _pins,
    center: _center,
    zoom: _zoom,
    radius: _radius,
    centerLocation: _centerLocation,
    onPinPress: _onPinPress,
    onViewportChange: _onViewportChange,
    onMapReady: _onMapReady,
    onClustersChange: _onClustersChange,
    pinStates: _pinStates,
  },
  ref
) {
  return (
    <View
      ref={ref as React.RefObject<View>}
      style={[{ minHeight, overflow: 'hidden' }, style]}
      accessibilityRole="image"
      accessibilityLabel="Map container"
    >
      {children}
    </View>
  )
})
