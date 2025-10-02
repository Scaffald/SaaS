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
  centerOnPin: (pinId: string) => void
  getPinScreenCoordinates: (pinId: string) => { x: number; y: number } | null
  setCardOverlay: (pinId: string | null, content: HTMLElement | null) => void
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  ({ pins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, style }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<unknown>(null)
    const markersRef = useRef(new Map<string, unknown>())
    const cardMarkerRef = useRef<unknown>(null)
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
      centerOnPin: (pinId: string) => {
        const map = mapRef.current as any
        const pin = pins.find((p) => p.id === pinId)
        if (map && pin) {
          map.flyTo({
            center: pin.coordinate,
            zoom: Math.max(map.getZoom(), 12), // Zoom in at least to level 12
            speed: 0.8,
          })
        }
      },
      getPinScreenCoordinates: (pinId: string) => {
        const map = mapRef.current as any
        const pin = pins.find((p) => p.id === pinId)
        if (!map || !pin || Platform.OS !== 'web') {
          return null
        }
        // Convert geo coordinates to screen coordinates
        const point = map.project(pin.coordinate)
        return { x: point.x, y: point.y }
      },
      setCardOverlay: (pinId: string | null, content: HTMLElement | null) => {
        const map = mapRef.current as any
        if (!map || Platform.OS !== 'web' || !mapboxgl) return

        const mapboxInstance = mapboxgl as any

        // Remove existing card marker
        if (cardMarkerRef.current) {
          ;(cardMarkerRef.current as any).remove()
          cardMarkerRef.current = null
        }

        // If pinId is null or no content, just remove the marker
        if (!pinId || !content) return

        // Find the pin
        const pin = pins.find((p) => p.id === pinId)
        if (!pin) return

        // Create a new marker anchored to the pin's coordinates
        const marker = new mapboxInstance.Marker({
          element: content,
          anchor: 'bottom', // Anchor the bottom of the card to the pin location
          offset: [0, -24], // Offset up by pin radius to position above pin
        })
          .setLngLat(pin.coordinate)
          .addTo(map)

        cardMarkerRef.current = marker
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
        // Add clustered source
        map.addSource('pins', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
          cluster: true,
          clusterMaxZoom: 17, // Max zoom to cluster points on
          clusterRadius: 50, // Radius of each cluster when clustering points (px)
        })

        // Add cluster circle layer
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'pins',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6', // Color for clusters with < 10 points
              10,
              '#f1f075', // Color for clusters with 10-99 points
              100,
              '#f28cb1', // Color for clusters with 100+ points
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20, // 40px diameter for < 10 points
              10,
              30, // 60px diameter for 10-99 points
              100,
              40, // 80px diameter for 100+ points
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        })

        // Add cluster count text layer
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'pins',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': [
              'step',
              ['get', 'point_count'],
              14, // Text size for < 10 points
              10,
              16, // Text size for 10-99 points
              100,
              18, // Text size for 100+ points
            ],
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Add layer for unclustered points (individual pins) - visible circles
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'pins',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['get', 'selected'], false],
              '#3B82F6', // Blue9 color for selected pins (blue-500)
              '#64748B', // Default: color9 equivalent (slate-500)
            ],
            'circle-radius': 24,
            'circle-stroke-width': [
              'case',
              ['boolean', ['get', 'selected'], false],
              3, // Thicker stroke for selected
              2,
            ],
            'circle-stroke-color': '#ffffff',
          },
        })

        // Add text layer for pin icons/emojis
        map.addLayer({
          id: 'unclustered-point-icon',
          type: 'symbol',
          source: 'pins',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['match', ['get', 'organization'], 'Organization', '🏢', '👤'],
            'text-size': 20,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Handle cluster clicks - zoom in
        map.on('click', 'clusters', (e: any) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          })
          const clusterId = features[0].properties.cluster_id
          map.getSource('pins').getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return

            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom,
            })
          })
        })

        // Change cursor on cluster hover
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = ''
        })

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

    // Handle pin clicks and empty map clicks
    useEffect(() => {
      if (!mapRef.current || !isMapReady || Platform.OS !== 'web') {
        return
      }

      const map = mapRef.current as any

      const handlePinClick = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point'],
        })

        if (features.length > 0 && features[0].properties.id) {
          onPinPress?.(features[0].properties.id)
        }
      }

      const handleMapClick = (e: any) => {
        // Check if clicking on a pin or cluster
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point', 'clusters'],
        })

        // If not clicking on any feature, deselect
        if (features.length === 0) {
          onPinPress?.(null)
        }
      }

      // Add click handler for individual pins
      map.on('click', 'unclustered-point', handlePinClick)

      // Add click handler for empty space
      map.on('click', handleMapClick)

      // Change cursor on hover
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = ''
      })

      return () => {
        map.off('click', 'unclustered-point', handlePinClick)
        map.off('click', handleMapClick)
        map.off('mouseenter', 'unclustered-point')
        map.off('mouseleave', 'unclustered-point')
      }
    }, [isMapReady, onPinPress])

    // Update GeoJSON source when pins change
    useEffect(() => {
      if (!mapRef.current || !isMapReady || Platform.OS !== 'web' || !mapboxgl) {
        return
      }

      const map = mapRef.current as any

      // Convert pins to GeoJSON features
      const geojsonData = {
        type: 'FeatureCollection',
        features: pins.map((pin) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: pin.coordinate,
          },
          properties: {
            id: pin.id,
            title: pin.title,
            subtitle: pin.subtitle,
            availability: pin.availability,
            organization: pin.organization,
            selected: pin.selected || false, // Include selected state
          },
        })),
      }

      // Update the source data
      const source = map.getSource('pins')
      if (source) {
        source.setData(geojsonData)
      }
    }, [pins, isMapReady])

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
                        ? '$red9'
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
