import type { MapView } from '@rnmapbox/maps'
import MapboxGL from '@rnmapbox/maps'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import type { MapContainerRef, ViewportBounds } from '@scaffald/ui'

import { getMapStyleUrl } from './mapboxStyleConfig'

interface MapPin {
  id: string
  coordinate: [number, number]
  title?: string
  organization?: string
  selected?: boolean
  pinType?: string
}

interface MapAdapterProps {
  pins?: unknown[]
  center?: [number, number]
  zoom?: number
  radius?: number
  centerLocation?: [number, number]
  onPinPress?: (id: string | null) => void
  onViewportChange?: (bounds: ViewportBounds) => void
  onMapReady?: (args: { bounds: ViewportBounds; zoom: number }) => void
  onClustersChange?: (clusters: unknown[]) => void
  pinStates?: Map<string, unknown>
  style?: object
}

export const MapAdapter = forwardRef<MapContainerRef, MapAdapterProps>(
  ({ pins: rawPins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, onMapReady, onViewportChange, style }, ref) => {
    const colorScheme = useColorScheme()
    const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light'
    const mapRef = useRef<MapView | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const cameraRef = useRef<MapboxGL.Camera | null>(null)
    const pins = (rawPins ?? []) as MapPin[]
    const latestPinsRef = useRef(pins)

    useEffect(() => { latestPinsRef.current = pins }, [pins])

    const mapStyle = getMapStyleUrl(resolvedTheme)

    useImperativeHandle(ref, () => ({
      centerOnPin: (pinId: string, options?: { preserveZoom?: boolean }) => {
        const pin = latestPinsRef.current.find((p) => p.id === pinId)
        if (pin && cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: pin.coordinate,
            zoomLevel: options?.preserveZoom ? undefined : 12,
            animationDuration: 800,
          })
        }
      },
      getPinScreenCoordinates: () => undefined,
      getContainerRect: () => undefined,
    }))

    useEffect(() => {
      if (!isMapReady || !onMapReady) return

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
          onMapReady?.({
            bounds: {
              north: Math.max(ne[1], sw[1]),
              south: Math.min(ne[1], sw[1]),
              east: Math.max(ne[0], sw[0]),
              west: Math.min(ne[0], sw[0]),
            },
            zoom,
          })
        } catch {
          // Fallback bounds
        }
      }

      void emitInitialBounds()
    }, [center, isMapReady, onMapReady, zoom])

    if (!MapboxGL) {
      return (
        <View style={[styles.fallback, style]}>
          <Text style={styles.fallbackText}>Mapbox SDK not available</Text>
        </View>
      )
    }

    const accessToken =
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
      process.env.MAPBOX_PUBLIC_TOKEN ??
      ''

    if (accessToken) {
      MapboxGL.setAccessToken(accessToken)
    }

    const handleRegionDidChange = async () => {
      if (!mapRef.current || !onViewportChange) return
      try {
        const bounds = await mapRef.current.getVisibleBounds()
        if (!bounds || bounds.length !== 2) return
        const [ne, sw] = bounds
        onViewportChange({
          north: Math.max(ne[1], sw[1]),
          south: Math.min(ne[1], sw[1]),
          east: Math.max(ne[0], sw[0]),
          west: Math.min(ne[0], sw[0]),
        })
      } catch { /* ignore */ }
    }

    return (
      <View style={[{ flex: 1 }, style]}>
        <MapboxGL.MapView
          ref={mapRef}
          style={{ flex: 1 }}
          styleURL={mapStyle}
          onDidFinishLoadingMap={() => setIsMapReady(true)}
          onRegionDidChange={handleRegionDidChange}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={zoom}
            centerCoordinate={center}
            animationDuration={0}
          />

          {pins.map((pin) => (
            <MapboxGL.PointAnnotation
              key={pin.id}
              id={pin.id}
              coordinate={pin.coordinate}
              onSelected={() => onPinPress?.(pin.id)}
            >
              <View style={[styles.pin, pin.selected && styles.pinSelected]}>
                <Text style={styles.pinEmoji}>
                  {pin.organization === 'Organization' || pin.pinType === 'organization'
                    ? '🏢'
                    : pin.organization === 'Job' || pin.pinType === 'job'
                      ? '💼'
                      : '👤'}
                </Text>
              </View>
            </MapboxGL.PointAnnotation>
          ))}
        </MapboxGL.MapView>
      </View>
    )
  }
)

MapAdapter.displayName = 'MapAdapter'

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  fallbackText: {
    fontSize: 14,
    color: '#6b7280',
  },
  pin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinSelected: {
    backgroundColor: '#3b82f6',
  },
  pinEmoji: {
    fontSize: 20,
  },
})
