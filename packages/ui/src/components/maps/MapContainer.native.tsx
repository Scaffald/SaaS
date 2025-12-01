import type { MapView } from '@rnmapbox/maps'
import MapboxGL from '@rnmapbox/maps'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Text, useThemeName, View } from 'tamagui'
import { MapFallback } from './MapFallback'
import { getMapStyleUrl } from './mapboxStyleConfig'
import type { MapContainerProps, MapContainerRef } from './types'

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  ({ pins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, onMapReady, style }, ref) => {
    const themeName = useThemeName()
    const resolvedTheme = themeName?.includes('dark') ? 'dark' : 'light'
    const mapRef = useRef<MapView | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)

    // Determine map style based on app theme
    const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
    const mapStyle = getMapStyleUrl(themeMode)

    // Expose map methods to parent (native has limited support)
    useImperativeHandle(ref, () => ({
      flyTo: (_newCenter: [number, number], _newZoom = zoom) => {
        // Native implementation would require calling native methods
        console.warn('flyTo not yet implemented for native')
      },
      centerOnPin: (_pinId: string, _options?: { preserveZoom?: boolean }) => {
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
      getContainerRect: () => {
        // Not available on native
        return null
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

    useEffect(() => {
      if (!isMapReady || !onMapReady) {
        return
      }

      async function emitInitialBounds() {
        try {
          const mapInstance = mapRef.current

          if (!mapInstance || typeof mapInstance.getVisibleBounds !== 'function') {
            onMapReady?.({
              bounds: {
                north: center[1] + 0.1,
                south: center[1] - 0.1,
                east: center[0] + 0.1,
                west: center[0] - 0.1,
              },
              zoom,
            })
            return
          }

          const bounds = await mapInstance.getVisibleBounds()
          if (!bounds || bounds.length !== 2) {
            onMapReady?.({
              bounds: {
                north: center[1] + 0.1,
                south: center[1] - 0.1,
                east: center[0] + 0.1,
                west: center[0] - 0.1,
              },
              zoom,
            })
            return
          }

          const [ne, sw] = bounds
          const east = Math.max(ne[0], sw[0])
          const west = Math.min(ne[0], sw[0])
          const north = Math.max(ne[1], sw[1])
          const south = Math.min(ne[1], sw[1])

          onMapReady?.({
            bounds: {
              north,
              south,
              east,
              west,
            },
            zoom,
          })
        } catch (error) {
          console.warn('MapContainer.native: unable to emit initial bounds', error)
        }
      }

      void emitInitialBounds()
    }, [center, isMapReady, onMapReady, zoom])

    return (
      <View flex={1} style={style}>
        {/* Theme-aware map style: dark theme for dark mode, streets for light mode */}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          styleURL={mapStyle}
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
