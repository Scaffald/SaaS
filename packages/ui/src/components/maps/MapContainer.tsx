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
              'match',
              ['get', 'availability'],
              'available',
              '#10B981',
              'unavailable',
              '#F59E0B',
              '#EF4444', // default/unavailable
            ],
            'circle-radius': 24,
            'circle-stroke-width': 2,
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

        // Add score badge layer
        map.addLayer({
          id: 'unclustered-point-score',
          type: 'circle',
          source: 'pins',
          filter: ['all', ['!', ['has', 'point_count']], ['has', 'score']],
          paint: {
            'circle-color': '#1F2937',
            'circle-radius': 10,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-translate': [16, -16],
          },
        })

        // Add score text layer
        map.addLayer({
          id: 'unclustered-point-score-text',
          type: 'symbol',
          source: 'pins',
          filter: ['all', ['!', ['has', 'point_count']], ['has', 'score']],
          layout: {
            'text-field': ['get', 'score'],
            'text-size': 10,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-translate': [16, -16],
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

    // Handle pin clicks on unclustered points
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

      // Add click handler for individual pins
      map.on('click', 'unclustered-point', handlePinClick)

      // Change cursor on hover
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = ''
      })

      return () => {
        map.off('click', 'unclustered-point', handlePinClick)
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
            score: pin.score,
            availability: pin.availability,
            organization: pin.organization,
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
