import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { View, Text } from 'tamagui'
import type { MapContainerProps, MapPin } from './types'

import 'mapbox-gl/dist/mapbox-gl.css'

// Web-specific imports
let mapboxgl: unknown

// Native-specific imports (Mapbox React Native SDK)
let MapboxGL: any

if (Platform.OS === 'web') {
  try {
    mapboxgl = require('mapbox-gl')
  } catch (e) {
    console.warn('Mapbox GL not available:', e)
  }
} else {
  try {
    MapboxGL = require('@rnmapbox/maps').default
  } catch (e) {
    console.warn('Mapbox React Native SDK not available:', e)
  }
}

export interface MapContainerRef {
  flyTo: (center: [number, number], zoom?: number) => void
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  ({ pins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, style }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<unknown>(null)
    const markersRef = useRef(new Map<string, unknown>())
    const [isMapReady, setIsMapReady] = useState(false)

    // Expose map methods to parent
    useImperativeHandle(ref, () => ({
      flyTo: (newCenter: [number, number], newZoom = zoom) => {
        const map = mapRef.current as any
        if (map?.flyTo) {
          map.flyTo({
            center: newCenter,
            zoom: newZoom,
            speed: 0.8,
          })
        }
      },
    }))

    // Initialize map (web only for now)
    useEffect(() => {
      if (Platform.OS !== 'web' || !mapboxgl || !mapContainerRef.current || mapRef.current) {
        return
      }

      // Set Mapbox access token
      const mapboxInstance = mapboxgl as any
      if (!mapboxInstance.accessToken) {
        mapboxInstance.accessToken =
          process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
          process.env.MAPBOX_PUBLIC_TOKEN ??
          'pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg'
      }

      const map = new mapboxInstance.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom,
        attributionControl: false,
      })

      // Add navigation controls
      map.addControl(new mapboxInstance.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxInstance.ScaleControl({ unit: 'imperial' }))

      map.on('load', () => {
        setIsMapReady(true)
      })

      mapRef.current = map

      return () => {
        if (map) {
          map.remove()
          mapRef.current = null
          markersRef.current.clear()
        }
      }
    }, [center, zoom])

    // Handle pin rendering
    const createPinElement = useCallback(
      (pin: MapPin) => {
        const element = document.createElement('div')
        element.style.cursor = 'pointer'

        // Create React root and render MapPin component
        // For now, we'll create a simple DOM element
        element.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background: ${
            pin.availability === 'available'
              ? '#10B981'
              : pin.availability === 'unavailable'
                ? '#F59E0B'
                : '#EF4444'
          };
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: ${pin.selected ? '3px solid #1E40AF' : '2px solid white'};
          transform: translate(-50%, -100%);
        ">
          ${pin.organization === 'Organization' ? '🏢' : '👤'}
          ${
            pin.score
              ? `<div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #1F2937;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            border: 2px solid white;
          ">${pin.score}</div>`
              : ''
          }
        </div>
      `

        element.addEventListener('click', () => {
          onPinPress?.(pin.id)
        })

        return element
      },
      [onPinPress]
    )

    // Update markers when pins change
    useEffect(() => {
      if (!mapRef.current || !isMapReady || Platform.OS !== 'web' || !mapboxgl) {
        return
      }

      const map = mapRef.current as any
      const currentMarkers = markersRef.current
      const mapboxInstance = mapboxgl as any

      // Remove markers that no longer exist
      const newPinIds = new Set(pins.map((p) => p.id))
      for (const [id, marker] of currentMarkers.entries()) {
        if (!newPinIds.has(id)) {
          const markerInstance = marker as any
          markerInstance.remove()
          currentMarkers.delete(id)
        }
      }

      // Add or update markers
      for (const pin of pins) {
        const existingMarker = currentMarkers.get(pin.id) as any

        if (existingMarker) {
          // Update existing marker position and appearance
          existingMarker.setLngLat(pin.coordinate)
          // Update element if needed (for selection state, etc.)
          const newElement = createPinElement(pin)
          existingMarker.getElement().replaceWith(newElement)
          existingMarker._element = newElement
        } else {
          // Create new marker
          const element = createPinElement(pin)
          const marker = new mapboxInstance.Marker({
            element,
            anchor: 'bottom',
          })
            .setLngLat(pin.coordinate)
            .addTo(map)

          currentMarkers.set(pin.id, marker)
        }
      }
    }, [pins, isMapReady, createPinElement])

    // Native implementation using Mapbox React Native SDK
    if (Platform.OS !== 'web') {
      if (!MapboxGL) {
        return (
          <View flex={1} bg="$background" items="center" justify="center" style={style}>
            <View bg="$backgroundHover" rounded="$4" p="$4" items="center" gap="$2">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                📍
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Mapbox Maps
              </Text>
              <Text fontSize="$3" color="$color11" text="center">
                Mapbox React Native SDK not installed.{'\n'}Run: yarn add @rnmapbox/maps
              </Text>
              <Text fontSize="$2" color="$color10" text="center">
                {pins.length} pins ready to display
              </Text>
            </View>
          </View>
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
                  w={48}
                  h={48}
                  rounded="$12"
                  bg={
                    pin.availability === 'available'
                      ? '$green9'
                      : pin.availability === 'unavailable'
                        ? '$orange9'
                        : '$red9'
                  }
                  borderWidth={pin.selected ? 3 : 2}
                  borderColor={pin.selected ? '$blue10' : 'white'}
                  items="center"
                  justify="center"
                  shadowColor="black"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.25}
                  shadowRadius={4}
                  elevation={5}
                >
                  <Text fontSize={20} color="white">
                    {pin.organization === 'Organization' ? '🏢' : '👤'}
                  </Text>

                  {pin.score && (
                    <View
                      position="absolute"
                      t={-8}
                      r={-8}
                      width={20}
                      height={20}
                      rounded="$12"
                      bg="$color12"
                      borderWidth={2}
                      borderColor="white"
                      items="center"
                      justify="center"
                    >
                      <Text fontSize={10} fontWeight="700" color="white">
                        {pin.score}
                      </Text>
                    </View>
                  )}
                </View>
              </PointAnnotation>
            ))}
          </MapView>
        </View>
      )
    }

    return (
      <View flex={1} position="relative" overflow="hidden" rounded="$5" style={style}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    )
  }
)

MapContainer.displayName = 'MapContainer'
