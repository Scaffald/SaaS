import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, Text } from 'tamagui'
import type { MapContainerProps, MapContainerRef } from './types'
import { MapFallback } from './MapFallback'
import type { MapView, Camera, PointAnnotation } from '@rnmapbox/maps'
import MapboxGL from '@rnmapbox/maps'

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  ({ pins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, style }, ref) => {
    const mapRef = useRef<MapView | null>(null)
    const [_isMapReady, setIsMapReady] = useState(false)

    // Expose map methods to parent (native has limited support)
    useImperativeHandle(ref, () => ({
      flyTo: (_newCenter: [number, number], _newZoom = zoom) => {
        // Native implementation would require calling native methods
        console.warn('flyTo not yet implemented for native')
      },
      centerOnPin: (_pinId: string) => {
        // Native implementation would require calling native methods
        console.warn('centerOnPin not yet implemented for native')
      },
      getPinScreenCoordinates: (_pinId: string) => {
        // Not supported on native platform
        return null
      },
      setCardOverlay: (_pinId: string | null, _content: HTMLElement | null) => {
        // Not supported on native platform (HTML elements don't exist in native)
        console.warn('setCardOverlay not supported on native')
      },
    }))

    if (!MapboxGL) {
      return (
        <MapFallback
          pinsCount={pins.length}
          message="Mapbox React Native SDK not installed.{'\n'}Run: pnpm add @rnmapbox/maps"
          style={style}
        />
      )
    }

    // Set Mapbox access token for native
    const accessToken =
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
      process.env.MAPBOX_PUBLIC_TOKEN ??
      'pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg'

    MapboxGL.setAccessToken(accessToken)

    const MapView = MapboxGL.MapView
    const Camera = MapboxGL.Camera
    const PointAnnotation = MapboxGL.PointAnnotation

    return (
      <View flex={1} style={style}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          styleURL="mapbox://styles/mapbox/streets-v12"
          onDidFinishLoadingMap={() => setIsMapReady(true)}
        >
          <Camera zoomLevel={zoom} centerCoordinate={center} animationDuration={0} />

          {pins.map((pin) => (
            <PointAnnotation
              key={pin.id}
              id={pin.id}
              coordinate={pin.coordinate}
              onSelected={() => onPinPress?.(pin.id)}
            >
              <View
                width={48}
                height={48}
                rounded="$12"
                bg={pin.selected ? '$blue10' : '$color9'}
                items="center"
                justify="center"
                shadowColor="black"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.25}
                shadowRadius={4}
              >
                <Text fontSize={20} color="$color9">
                  {pin.organization === 'Organization' ? '🏢' : '👤'}
                </Text>
              </View>
            </PointAnnotation>
          ))}
        </MapView>
      </View>
    )
  }
)

MapContainer.displayName = 'MapContainer'
