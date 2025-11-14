import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'tamagui'
import type { MapContainerProps, MapContainerRef, ViewportBounds } from './types'
import { MapFallback } from './MapFallback'
import {
  createClusterMarkerHTML,
  createPinMarkerHTML,
  getTypeColor,
  getDominantType,
} from './markerUtils'

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
    const markersRef = useRef(new Map<string, mapboxgl.Marker>())
    const clusterMarkersRef = useRef(new Map<string, mapboxgl.Marker>())
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

        // Add invisible cluster layer so Mapbox creates clusters
        // We'll overlay HTML markers on top for custom styling
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'pins',
          filter: ['has', 'point_count'],
          paint: {
            'circle-opacity': 0, // Invisible - we use HTML markers instead
            'circle-radius': 1,
          },
        })

        // Add invisible individual point layers so they're queryable
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'pins',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-opacity': 0, // Invisible - we use HTML markers instead
            'circle-radius': 1,
          },
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
          markersRef.current.clear()
        }
      }
    }, [center, zoom, onViewportChange, onMapReady])

    // Handle map clicks for deselection
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Only deselect if clicking on empty space (not on a marker)
        // Markers handle their own clicks
        onPinPress?.(null)
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

    // Render HTML markers for clusters and individual pins
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current
      const source = map.getSource('pins') as mapboxgl.GeoJSONSource | null

      if (!source) {
        return
      }

      // Function to update markers based on current map state
      const updateMarkers = () => {
        // Remove all existing markers
        for (const marker of markersRef.current.values()) {
          marker.remove()
        }
        markersRef.current.clear()
        for (const marker of clusterMarkersRef.current.values()) {
          marker.remove()
        }
        clusterMarkersRef.current.clear()

        // Get current zoom and bounds
        const zoom = map.getZoom()
        const bounds = map.getBounds()

        // Check if layers exist
        if (!map.getLayer('clusters') || !map.getLayer('unclustered-point')) {
          return
        }

        // Query rendered features from the invisible layers
        // This will include clusters and individual points
        const allFeatures = map.queryRenderedFeatures(undefined, {
          layers: ['clusters', 'unclustered-point'],
        })

        if (allFeatures.length === 0) {
          // If no rendered features, try querying source features as fallback
          const sourceFeatures = map.querySourceFeatures('pins', {
            sourceLayer: undefined,
            filter: undefined,
          })
          if (sourceFeatures.length === 0) {
            return
          }
          // Process source features (these might not have cluster properties yet)
          for (const feature of sourceFeatures) {
            if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.properties) {
              continue
            }
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
            const props = feature.properties

            // Only process individual points from source (clusters need to be rendered)
            if (!props.cluster && props.id) {
              const pinType = (props.type as 'worker' | 'organization' | 'job') || 'worker'
              const selected = props.selected === true
              const pinId = props.id as string

              const html = createPinMarkerHTML(pinType, selected, 48)
              const el = document.createElement('div')
              el.innerHTML = html
              const markerEl = el.firstElementChild as HTMLElement
              if (!markerEl) continue

              markerEl.addEventListener('click', (e) => {
                e.stopPropagation()
                onPinPress?.(pinId)
              })

              const marker = new mapboxgl.Marker({
                element: markerEl,
                anchor: 'center',
              })
                .setLngLat(coords)
                .addTo(map)

              markersRef.current.set(pinId, marker)
            }
          }
          return
        }

        for (const feature of allFeatures) {
          if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.properties) {
            continue
          }

          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
          const props = feature.properties

          // Check if it's a cluster
          if (props.cluster === true && props.point_count) {
            const workerCount = (props.worker_count as number) || 0
            const orgCount = (props.org_count as number) || 0
            const jobCount = (props.job_count as number) || 0
            const totalCount = props.point_count as number

            // Determine cluster size based on count
            const size = totalCount < 10 ? 60 : totalCount < 100 ? 70 : 80

            // Create cluster marker HTML
            const html = createClusterMarkerHTML(workerCount, orgCount, jobCount, totalCount, size)

            // Create marker element
            const el = document.createElement('div')
            el.innerHTML = html
            const markerEl = el.firstElementChild as HTMLElement
            if (!markerEl) return

            // Add click handler to zoom in
            markerEl.addEventListener('click', (e) => {
              e.stopPropagation()
              const clusterId = props.cluster_id as number
              source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return
                map.easeTo({
                  center: coords,
                  zoom: zoom as number,
                })
              })
            })

            // Create and add marker
            const marker = new mapboxgl.Marker({
              element: markerEl,
              anchor: 'center',
            })
              .setLngLat(coords)
              .addTo(map)

            clusterMarkersRef.current.set(`cluster-${props.cluster_id}`, marker)
          } else if (!props.cluster && props.id) {
            // Individual pin
            const pinType = (props.type as 'worker' | 'organization' | 'job') || 'worker'
            const selected = props.selected === true
            const pinId = props.id as string

            // Create pin marker HTML
            const html = createPinMarkerHTML(pinType, selected, 48)

            // Create marker element
            const el = document.createElement('div')
            el.innerHTML = html
            const markerEl = el.firstElementChild as HTMLElement
            if (!markerEl) return

            // Add click handler
            markerEl.addEventListener('click', (e) => {
              e.stopPropagation()
              onPinPress?.(pinId)
            })

            // Create and add marker
            const marker = new mapboxgl.Marker({
              element: markerEl,
              anchor: 'center',
            })
              .setLngLat(coords)
              .addTo(map)

            markersRef.current.set(pinId, marker)
          }
        }
      }

      // Update markers when source data changes
      const handleData = (e: { dataType?: string }) => {
        // Only update if it's a data change, not a style change
        if (e.dataType === 'source' || e.dataType === undefined) {
          // Use setTimeout to ensure the data is fully processed
          setTimeout(() => {
            updateMarkers()
          }, 100)
        }
      }

      // Update markers on zoom/move to handle clustering changes
      const handleMoveEnd = () => {
        updateMarkers()
      }

      source.on('data', handleData)
      map.on('moveend', handleMoveEnd)
      map.on('zoomend', handleMoveEnd)

      // Initial update - wait a bit for layers to be ready
      setTimeout(() => {
        updateMarkers()
      }, 200)

      return () => {
        source.off('data', handleData)
        map.off('moveend', handleMoveEnd)
        map.off('zoomend', handleMoveEnd)
        for (const marker of markersRef.current.values()) {
          marker.remove()
        }
        markersRef.current.clear()
        for (const marker of clusterMarkersRef.current.values()) {
          marker.remove()
        }
        clusterMarkersRef.current.clear()
      }
    }, [pins, isMapReady, onPinPress])

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
