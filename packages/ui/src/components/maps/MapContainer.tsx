import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'tamagui'
import type { MapContainerProps, MapContainerRef, ViewportBounds } from './types'
import { MapFallback } from './MapFallback'

import 'mapbox-gl/dist/mapbox-gl.css'

// Import mapboxgl with proper typing
import mapboxgl from 'mapbox-gl'

/**
 * Extract viewport bounds from a Mapbox map instance
 */
function extractViewportBounds(map: mapboxgl.Map): ViewportBounds {
  const bounds = map.getBounds() as mapboxgl.LngLatBounds
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  (
    {
      pins,
      center = [-84.5555, 42.7325],
      zoom = 7,
      onPinPress,
      onViewportChange,
      onMapReady,
      style,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const cardMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)

    // Viewport change handler ref for debouncing
    const viewportChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Expose map methods to parent
    useImperativeHandle(ref, () => ({
      flyTo: (newCenter: [number, number], newZoom = zoom) => {
        const map = mapRef.current
        if (map?.flyTo) {
          map.flyTo({
            center: newCenter,
            zoom: newZoom,
            speed: 0.8,
          })
        }
      },
      centerOnPin: (pinId: string) => {
        const map = mapRef.current
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
        const map = mapRef.current
        const pin = pins.find((p) => p.id === pinId)
        if (!map || !pin) {
          return null
        }
        // Convert geo coordinates to screen coordinates
        const point = map.project(pin.coordinate)
        return { x: point.x, y: point.y }
      },
      setCardOverlay: (pinId: string | null, content: HTMLElement | null) => {
        const map = mapRef.current
        if (!map) return

        // Remove existing card marker
        if (cardMarkerRef.current) {
          cardMarkerRef.current.remove()
          cardMarkerRef.current = null
        }

        // If pinId is null or no content, just remove the marker
        if (!pinId || !content) return

        // Find the pin
        const pin = pins.find((p) => p.id === pinId)
        if (!pin) return

        // Create a new marker anchored to the pin's coordinates
        const marker = new mapboxgl.Marker({
          element: content,
          anchor: 'bottom', // Anchor the bottom of the card to the pin location
          offset: [0, -24], // Offset up by pin radius to position above pin
        })
          .setLngLat(pin.coordinate)
          .addTo(map)

        cardMarkerRef.current = marker
      },
    }))

    // Initialize map
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) {
        return
      }

      // Set Mapbox access token
      if (!mapboxgl.accessToken) {
        mapboxgl.accessToken =
          process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
          process.env.MAPBOX_PUBLIC_TOKEN ??
          'pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg'
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom,
        attributionControl: false,
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }))

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
          clusterProperties: {
            worker_count: ['+', ['case', ['==', ['get', 'type'], 'worker'], 1, 0]],
            org_count: ['+', ['case', ['==', ['get', 'type'], 'organization'], 1, 0]],
            job_count: ['+', ['case', ['==', ['get', 'type'], 'job'], 1, 0]],
          },
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

        // Add layer for worker pins (circles)
        map.addLayer({
          id: 'worker-point',
          type: 'circle',
          source: 'pins',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['!=', ['get', 'organization'], 'Organization'],
          ],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['get', 'selected'], false],
              '#3B82F6', // Blue color for selected pins
              '#22C55E', // Green for available workers
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

        // Add text layer for worker icons
        map.addLayer({
          id: 'worker-point-icon',
          type: 'symbol',
          source: 'pins',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['!=', ['get', 'organization'], 'Organization'],
          ],
          layout: {
            'text-field': '👤',
            'text-size': 20,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Add layer for organization pins (larger purple squares)
        map.addLayer({
          id: 'org-point',
          type: 'circle',
          source: 'pins',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'organization'], 'Organization'],
          ],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['get', 'selected'], false],
              '#3B82F6', // Blue for selected
              '#A855F7', // Purple for organizations
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

        // Add text layer for organization icons
        map.addLayer({
          id: 'org-point-icon',
          type: 'symbol',
          source: 'pins',
          filter: [
            'all',
            ['!', ['has', 'point_count']],
            ['==', ['get', 'organization'], 'Organization'],
          ],
          layout: {
            'text-field': '🏢',
            'text-size': 20,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        })

        // Handle cluster clicks
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          })
          const clusterId = features[0]?.properties?.cluster_id
          const source = map.getSource('pins') as mapboxgl.GeoJSONSource

          if (clusterId !== undefined && source) {
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return

              map.easeTo({
                center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
                zoom: zoom as number,
              })
            })
          }
        })

        // Handle worker pin clicks
        map.on('click', 'worker-point', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['worker-point'],
          })
          if (features[0]?.properties?.id) {
            onPinPress?.(features[0].properties.id as string)
          }
        })

        // Handle organization pin clicks
        map.on('click', 'org-point', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['org-point'],
          })
          if (features[0]?.properties?.id) {
            onPinPress?.(features[0].properties.id as string)
          }
        })

        // Change cursor on hover
        map.on('mouseenter', 'worker-point', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'worker-point', () => {
          map.getCanvas().style.cursor = ''
        })
        map.on('mouseenter', 'org-point', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'org-point', () => {
          map.getCanvas().style.cursor = ''
        })
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = ''
        })

        // Track viewport changes (pan and zoom) with debouncing (500ms)
        // Use 'moveend' and 'zoomend' events which fire after pan/zoom completes
        if (onViewportChange) {
          const handleViewportChangeDebounced = () => {
            // Clear existing timeout
            if (viewportChangeTimeoutRef.current) {
              clearTimeout(viewportChangeTimeoutRef.current)
            }

            // Set new timeout
            viewportChangeTimeoutRef.current = setTimeout(() => {
              const bounds = extractViewportBounds(map)
              const currentZoom = map.getZoom()
              onViewportChange(bounds, currentZoom)
            }, 500)
          }

          map.on('moveend', handleViewportChangeDebounced)
          map.on('zoomend', handleViewportChangeDebounced)
        }

        setIsMapReady(true)

        if (onMapReady) {
          const initialBounds = extractViewportBounds(map)
          onMapReady({
            bounds: initialBounds,
            zoom: map.getZoom(),
          })
        }
      })

      mapRef.current = map

      return () => {
        // Clear any pending viewport change timeout
        if (viewportChangeTimeoutRef.current) {
          clearTimeout(viewportChangeTimeoutRef.current)
          viewportChangeTimeoutRef.current = null
        }

        if (map) {
          map.remove()
          mapRef.current = null
        }
      }
    }, [center, zoom, onViewportChange, onMapReady])

    // Handle map clicks for deselection (only on empty space, not on layers)
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Check if click was on a layer - if so, don't deselect
        const features = map.queryRenderedFeatures(e.point)
        if (features.length === 0) {
          // Click was on empty space, deselect
          onPinPress?.(null)
        }
      }

      map.on('click', handleMapClick)

      return () => {
        map.off('click', handleMapClick)
      }
    }, [isMapReady, onPinPress])

    // Update GeoJSON source when pins change
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      // Convert pins to GeoJSON features
      const geojsonData: GeoJSON.FeatureCollection = {
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
            type:
              pin.type ||
              (pin.organization === 'Individual'
                ? 'worker'
                : pin.organization === 'Organization'
                  ? 'organization'
                  : 'job'),
            selected: pin.selected || false, // Include selected state
          },
        })),
      }

      // Update the source data
      const source = map.getSource('pins') as mapboxgl.GeoJSONSource
      if (source) {
        source.setData(geojsonData)
      }
    }, [pins, isMapReady])

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
