import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'tamagui'
import type { MapContainerProps, MapContainerRef } from './types'
import { MapFallback } from './MapFallback'

import 'mapbox-gl/dist/mapbox-gl.css'

// Import mapboxgl with proper typing
import mapboxgl from 'mapbox-gl'

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  ({ pins, center = [-84.5555, 42.7325], zoom = 7, onPinPress, style }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef(new Map<string, mapboxgl.Marker>())
    const cardMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)

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
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          })
          if (!features || features.length === 0 || !features[0].properties?.cluster_id) {
            return
          }
          const clusterId = features[0].properties.cluster_id
          const source = map.getSource('pins') as mapboxgl.GeoJSONSource | null
          if (!source) {
            console.error('No source found')
            return
          }
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return

            map.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom: zoom as number,
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
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handlePinClick = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point'],
        })

        if (features.length > 0 && features[0].properties?.id) {
          onPinPress?.(features[0].properties.id)
        }
      }

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Check if clicking on a pin or cluster
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point', 'clusters'],
        })

        // If not clicking on any feature, deselect
        if (features.length === 0) {
          onPinPress?.(null)
        }
      }

      // Cursor change handlers
      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }
      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      // Add click handler for individual pins
      map.on('click', 'unclustered-point', handlePinClick)

      // Add click handler for empty space
      map.on('click', handleMapClick)

      // Change cursor on hover
      map.on('mouseenter', 'unclustered-point', handleMouseEnter)
      map.on('mouseleave', 'unclustered-point', handleMouseLeave)

      return () => {
        map.off('click', 'unclustered-point', handlePinClick)
        map.off('click', handleMapClick)
        map.off('mouseenter', 'unclustered-point', handleMouseEnter)
        map.off('mouseleave', 'unclustered-point', handleMouseLeave)
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
