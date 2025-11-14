import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'tamagui'
import type { MapContainerProps, MapContainerRef, ViewportBounds, ClusterInfo } from './types'
import type { CustomMarker } from './CustomMarker'
import { generateCirclePolygon, validateGeoJSONFeatureCollection } from './utils'
import { useThemeSetting } from '../../../../core/provider/theme/UniversalThemeProvider'
import { createPulsingDot } from './PulsingDot'

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

function ensurePulsingDotImage(map: mapboxgl.Map) {
  if (map.hasImage('pulsing-dot')) {
    map.removeImage('pulsing-dot')
  }

  const pulsingDot = createPulsingDot(map, {
    size: 200,
    innerColor: 'rgba(59, 130, 246, 1)',
    outerColor: 'rgba(59, 130, 246, 0.4)',
    duration: 1000,
  })

  map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 })
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  (
    {
      pins,
      center = [-84.5555, 42.7325],
      zoom = 7,
      radius,
      centerLocation,
      onPinPress,
      onPinHover,
      onViewportChange,
      onMapReady,
      onClustersChange,
      pinStates: _pinStates,
      style,
    },
    ref
  ) => {
    const { resolvedTheme } = useThemeSetting()
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef(new Map<string, CustomMarker>())
    const cardMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const centerMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(zoom)
    // Determine map style based on app theme
    const mapStyle =
      resolvedTheme === 'dark'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12'
    const isStyleLoadingRef = useRef(false)
    const latestPinsRef = useRef(pins)
    const currentStyleRef = useRef(mapStyle)
    const onPinPressRef = useRef(onPinPress)
    const onPinHoverRef = useRef(onPinHover)
    const onClustersChangeRef = useRef(onClustersChange)

    useEffect(() => {
      latestPinsRef.current = pins
    }, [pins])

    useEffect(() => {
      onPinPressRef.current = onPinPress
    }, [onPinPress])

    useEffect(() => {
      onPinHoverRef.current = onPinHover
    }, [onPinHover])

    useEffect(() => {
      onClustersChangeRef.current = onClustersChange
    }, [onClustersChange])

    // Viewport change handler ref for debouncing
    const viewportChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Resize handler ref for debouncing
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

      try {
        // Theme-aware map style: dark theme for dark mode, streets for light mode
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center,
          zoom,
          attributionControl: false,
        })

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }))

        map.on('load', () => {
          // Add clustered source for performance with large datasets
          map.addSource('pins', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
            cluster: true,
            clusterMaxZoom: 14, // Max zoom to cluster points on
            clusterRadius: 50, // Radius of each cluster when clustering points (px)
            generateId: true, // Generate IDs for features
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
                '#51bbd6', // Blue for clusters with < 100 points
                100,
                '#f1f075', // Yellow for clusters with 100-749 points
                750,
                '#f28cb1', // Pink for clusters with 750+ points
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20, // 20px radius for < 100 points
                100,
                30, // 30px radius for 100-749 points
                750,
                40, // 40px radius for 750+ points
              ],
              'circle-emissive-strength': 1,
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
              'text-size': 12,
            },
          })

          // Add unclustered point layer
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'pins',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['has', 'color'],
                ['get', 'color'],
                '#11b4da', // Default blue color
              ],
              'circle-radius': 4,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff',
              'circle-emissive-strength': 1,
            },
          })

          // Handle cluster clicks - zoom in
          map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ['clusters'],
            })
            if (!features.length) {
              return
            }
            const clusterFeature = features[0]
            const clusterId = clusterFeature.properties?.cluster_id
            if (typeof clusterId !== 'number') {
              return
            }
            const source = map.getSource('pins') as mapboxgl.GeoJSONSource | undefined
            if (!source) {
              return
            }
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err || typeof zoom !== 'number') return
              map.easeTo({
                center: (clusterFeature.geometry as GeoJSON.Point).coordinates as [number, number],
                zoom,
              })
            })
          })

          // Handle unclustered point clicks
          map.on('click', 'unclustered-point', (e) => {
            const pinId = e.features?.[0]?.properties?.id
            if (pinId) {
              onPinPressRef.current?.(pinId)
            }
          })

          // Change cursor on hover
          map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = ''
          })
          map.on('mouseenter', 'unclustered-point', () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = ''
          })

          // Handle unclustered point hover for tooltip
          map.on('mouseenter', 'unclustered-point', (e) => {
            const pinId = e.features?.[0]?.properties?.id
            if (pinId) {
              onPinHoverRef.current?.(pinId)
            }
          })
          map.on('mouseleave', 'unclustered-point', () => {
            onPinHoverRef.current?.(null)
          })

          // Add pulsing dot image for selected pins
          ensurePulsingDotImage(map)

          // Add source for selected pin pulse
          map.addSource('selected-pin-pulse', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })

          // Add symbol layer for pulsing dot (positioned below DOM markers, above map layers)
          // DOM markers (CustomMarker) render on top, so this will appear behind them
          map.addLayer({
            id: 'selected-pin-pulse-layer',
            type: 'symbol',
            source: 'selected-pin-pulse',
            layout: {
              'icon-image': 'pulsing-dot',
              'icon-size': 0.5, // Scale down the 200px image to reasonable size
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
                const newZoom = map.getZoom()
                setCurrentZoom(newZoom)
                onViewportChange(bounds, newZoom)
              }, 500)
            }

            map.on('moveend', handleViewportChangeDebounced)
            map.on('zoomend', handleViewportChangeDebounced)
          }

          setIsMapReady(true)

          if (onMapReady) {
            const initialBounds = extractViewportBounds(map)
            const initialZoom = map.getZoom()
            setCurrentZoom(initialZoom)
            onMapReady({
              bounds: initialBounds,
              zoom: initialZoom,
            })
          }
        })

        // Handle map errors
        map.on('error', (e) => {
          console.error('Mapbox error:', e.error)
        })

        mapRef.current = map

        return () => {
          // Clear any pending timeouts
          if (viewportChangeTimeoutRef.current) {
            clearTimeout(viewportChangeTimeoutRef.current)
            viewportChangeTimeoutRef.current = null
          }
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
            resizeTimeoutRef.current = null
          }

          if (map) {
            map.remove()
            mapRef.current = null
            markersRef.current.clear()
          }
        }
      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }, [center, zoom, onViewportChange, onMapReady, mapStyle])

    // Update map style when theme changes
    useEffect(() => {
      const map = mapRef.current
      if (!map || !isMapReady) return

      if (currentStyleRef.current === mapStyle) {
        return
      }

      currentStyleRef.current = mapStyle
      isStyleLoadingRef.current = true
      map.setStyle(mapStyle)

      const handleStyleData = () => {
        isStyleLoadingRef.current = false

        // Re-add pins source if it doesn't exist
        if (!map.getSource('pins')) {
          map.addSource('pins', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
            generateId: true,
          })
        }

        // Re-add cluster layers
        if (!map.getLayer('clusters')) {
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'pins',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#51bbd6',
                100,
                '#f1f075',
                750,
                '#f28cb1',
              ],
              'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
              'circle-emissive-strength': 1,
            },
          })
        }

        if (!map.getLayer('cluster-count')) {
          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'pins',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
          })
        }

        // Re-add unclustered point layer
        if (!map.getLayer('unclustered-point')) {
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'pins',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': [
                'case',
                ['has', 'color'],
                ['get', 'color'],
                '#11b4da', // Default blue color
              ],
              'circle-radius': 4,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff',
              'circle-emissive-strength': 1,
            },
          })
        }

        // Re-add pulsing dot image
        ensurePulsingDotImage(map)

        // Re-add source for selected pin pulse
        if (!map.getSource('selected-pin-pulse')) {
          map.addSource('selected-pin-pulse', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          })
        }

        // Re-add symbol layer for pulsing dot
        if (!map.getLayer('selected-pin-pulse-layer')) {
          map.addLayer({
            id: 'selected-pin-pulse-layer',
            type: 'symbol',
            source: 'selected-pin-pulse',
            layout: {
              'icon-image': 'pulsing-dot',
              'icon-size': 0.5,
            },
          })
        }

        // Update selected pin pulse if there's a selected pin
        const pinsSnapshot = latestPinsRef.current
        const selectedPin = pinsSnapshot.find((pin) => pin.selected === true)
        if (selectedPin) {
          const source = map.getSource('selected-pin-pulse') as mapboxgl.GeoJSONSource | null
          if (source) {
            const [lng, lat] = selectedPin.coordinate
            if (
              typeof lng === 'number' &&
              typeof lat === 'number' &&
              !Number.isNaN(lng) &&
              !Number.isNaN(lat) &&
              lng >= -180 &&
              lng <= 180 &&
              lat >= -90 &&
              lat <= 90
            ) {
              try {
                source.setData({
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: selectedPin.coordinate,
                      },
                      properties: {
                        id: selectedPin.id,
                      },
                    },
                  ],
                })
              } catch (error) {
                console.warn('Error updating selected pin pulse:', error)
              }
            }
          }
        }
      }

      map.once('styledata', handleStyleData)

      return () => {
        map.off('styledata', handleStyleData)
      }
    }, [mapStyle, isMapReady])

    // Handle map resize events
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handleResize = () => {
        // Debounce resize calls
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }

        resizeTimeoutRef.current = setTimeout(() => {
          try {
            map.resize()
          } catch (error) {
            console.error('Error resizing map:', error)
          }
        }, 150)
      }

      // Listen for window resize
      window.addEventListener('resize', handleResize)

      // Listen for custom sidebar expansion events (if applicable)
      window.addEventListener('sidebar-expand', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('sidebar-expand', handleResize)
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
          resizeTimeoutRef.current = null
        }
      }
    }, [isMapReady])

    // Handle empty map clicks (deselect when clicking on empty space)
    // Note: Layer-specific click handlers are set up in map.on('load') and style change handlers
    // This handler only fires for clicks that don't hit any layer
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Check if clicking on any map feature (clusters, unclustered points, or other layers)
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters', 'unclustered-point', 'selected-pin-pulse-layer'],
        })

        // If not clicking on any feature, deselect
        // Layer-specific handlers will handle clicks on clusters and unclustered points
        if (features.length === 0) {
          onPinPressRef.current?.(null)
        }
      }

      // Add click handler for empty space (with lower priority than layer handlers)
      // Layer handlers fire first, so this only fires for empty space
      map.on('click', handleMapClick)

      return () => {
        map.off('click', handleMapClick)
      }
    }, [isMapReady])

    // Update markers when pins or zoom change
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      try {
        // Validate pins data
        if (!Array.isArray(pins)) {
          console.warn('Invalid pins data: expected array')
          return
        }

        const CLUSTER_MAX_ZOOM = 14

        // Update GeoJSON source with all pins
        // Mapbox handles clustering and rendering automatically
        const geojsonData: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: pins
            .filter((pin) => {
              // Only include valid pins
              return (
                pin.id &&
                pin.coordinate &&
                Array.isArray(pin.coordinate) &&
                pin.coordinate.length === 2 &&
                typeof pin.coordinate[0] === 'number' &&
                typeof pin.coordinate[1] === 'number' &&
                !Number.isNaN(pin.coordinate[0]) &&
                !Number.isNaN(pin.coordinate[1])
              )
            })
            .map((pin) => ({
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
                ...(pin.color && { color: pin.color }),
              },
            })),
        }

        // Validate GeoJSON before updating
        if (validateGeoJSONFeatureCollection(geojsonData)) {
          try {
            const source = map.getSource('pins') as mapboxgl.GeoJSONSource | null
            if (source) {
              source.setData(geojsonData)
            }
          } catch (error) {
            console.warn('Error updating pins source:', error)
          }
        } else {
          console.warn('Invalid GeoJSON data generated from pins')
        }

        // Update cluster info for state management
        // Use requestAnimationFrame to ensure source is updated
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              const notifyClusters = (clusters: ClusterInfo[]) => {
                onClustersChangeRef.current?.(clusters)
              }

              // Verify map is loaded and source exists
              if (!map.isStyleLoaded() || !map.loaded()) {
                notifyClusters([])
                return
              }

              const pinsSource = map.getSource('pins') as mapboxgl.GeoJSONSource | null
              if (!pinsSource) {
                return
              }

              // Only query clusters if we're at a zoom level where clustering occurs
              if (currentZoom > CLUSTER_MAX_ZOOM) {
                notifyClusters([])
                return
              }

              // Query source features to get all clusters
              // Wrap in try-catch to handle cases where source might not be ready
              try {
                const sourceFeatures = map.querySourceFeatures('pins', {
                  sourceLayer: undefined,
                  filter: ['has', 'point_count'],
                })

                // Extract cluster information
                const clusterFeatures = sourceFeatures
                  .map((feature) => {
                    if (feature.geometry.type === 'Point' && feature.properties?.cluster_id) {
                      return {
                        coordinates: feature.geometry.coordinates as [number, number],
                        clusterId: feature.properties.cluster_id as number,
                        pointCount: (feature.properties.point_count as number) || 0,
                      }
                    }
                    return null
                  })
                  .filter((item): item is NonNullable<typeof item> => item !== null)

                if (clusterFeatures.length === 0) {
                  notifyClusters([])
                  return
                }

                // Extract cluster info with member pin IDs for state management
                const clusterInfos: ClusterInfo[] = []
                let processedClusters = 0
                const totalClusters = clusterFeatures.length

                // Process each cluster to get member pin IDs
                for (const cluster of clusterFeatures) {
                  try {
                    pinsSource.getClusterLeaves(
                      cluster.clusterId,
                      Number.MAX_SAFE_INTEGER,
                      0,
                      (err, leaves) => {
                        if (!err && leaves) {
                          const memberPinIds = leaves
                            .map((leaf) => leaf.properties?.id as string)
                            .filter((id): id is string => typeof id === 'string')

                          clusterInfos.push({
                            clusterId: cluster.clusterId,
                            coordinates: cluster.coordinates,
                            pointCount: cluster.pointCount,
                            memberPinIds,
                          })
                        }

                        processedClusters++
                        // Call callback when all clusters are processed
                        if (processedClusters === totalClusters) {
                          notifyClusters(clusterInfos)
                        }
                      }
                    )
                  } catch (error) {
                    console.warn('Error getting cluster leaves:', error)
                    processedClusters++
                    if (processedClusters === totalClusters) {
                      notifyClusters(clusterInfos)
                    }
                  }
                }
              } catch (error) {
                console.warn('Failed to query source clusters:', error)
                notifyClusters([])
              }
            } catch (error) {
              console.warn('Error processing clusters:', error)
              onClustersChangeRef.current?.([])
            }
          })
        })

        // Remove all CustomMarkers since we're using layer-based rendering
        // Only keep markers for special cases (like card overlays)
        for (const [pinId, marker] of markersRef.current.entries()) {
          // Don't remove card marker
          if (marker !== cardMarkerRef.current) {
            try {
              marker.remove()
              markersRef.current.delete(pinId)
            } catch (error) {
              console.warn('Error removing marker:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error updating markers:', error)
      }
    }, [pins, isMapReady, currentZoom])

    // Pin states are now handled by Mapbox layers
    // Opacity and visibility can be controlled via layer paint properties if needed
    // For now, we rely on the layer-based rendering which is more performant

    // Update radius circle when radius or centerLocation changes
    useEffect(() => {
      if (!mapRef.current || !isMapReady || !radius || !centerLocation) {
        return
      }

      const map = mapRef.current

      try {
        // Validate radius
        if (radius < 0 || radius > 200) {
          console.warn('Invalid radius value:', radius, 'Expected 0-200 miles')
          return
        }

        // Validate centerLocation
        const [lng, lat] = centerLocation
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          Number.isNaN(lng) ||
          Number.isNaN(lat)
        ) {
          console.warn('Invalid centerLocation coordinates:', centerLocation)
          return
        }

        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.warn('centerLocation coordinates out of range:', centerLocation)
          return
        }

        // Generate circle polygon
        const circlePolygon = generateCirclePolygon(centerLocation, radius)

        // Check if source exists, create if not
        const source = map.getSource('locationCircle') as mapboxgl.GeoJSONSource | null
        if (!source) {
          map.addSource('locationCircle', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [circlePolygon],
            },
          })

          // Add fill layer
          map.addLayer({
            id: 'circle-fill',
            type: 'fill',
            source: 'locationCircle',
            paint: {
              'fill-color': 'hsl(0, 0%, 13%)',
              'fill-opacity': 0.04,
            },
            filter: ['==', ['geometry-type'], 'Polygon'],
          })

          // Add outline layer
          map.addLayer({
            id: 'circle-outline',
            type: 'line',
            source: 'locationCircle',
            paint: {
              'line-color': 'hsl(0, 0%, 13%)',
              'line-opacity': 0.24,
            },
            filter: ['==', ['geometry-type'], 'Polygon'],
          })
        } else {
          // Update existing source
          source.setData({
            type: 'FeatureCollection',
            features: [circlePolygon],
          })
        }
      } catch (error) {
        console.error('Error updating radius circle:', error)
      }
    }, [radius, centerLocation, isMapReady])

    // Update center location marker
    useEffect(() => {
      if (!mapRef.current || !isMapReady || !centerLocation) {
        // Remove marker if centerLocation is not provided
        if (centerMarkerRef.current) {
          centerMarkerRef.current.remove()
          centerMarkerRef.current = null
        }
        return
      }

      const map = mapRef.current

      try {
        // Validate centerLocation
        const [lng, lat] = centerLocation
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          Number.isNaN(lng) ||
          Number.isNaN(lat)
        ) {
          console.warn('Invalid centerLocation coordinates:', centerLocation)
          return
        }

        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.warn('centerLocation coordinates out of range:', centerLocation)
          return
        }

        // Remove existing marker
        if (centerMarkerRef.current) {
          centerMarkerRef.current.remove()
        }

        // Create new center marker
        const el = document.createElement('div')
        el.style.width = '12px'
        el.style.height = '12px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = 'hsl(212, 92%, 41%)'
        el.style.border = '2px solid white'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

        centerMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(centerLocation)
          .addTo(map)
      } catch (error) {
        console.error('Error updating center location marker:', error)
      }
    }, [centerLocation, isMapReady])

    // Update pulsing dot for selected pin
    useEffect(() => {
      if (!mapRef.current || !isMapReady || isStyleLoadingRef.current) {
        return
      }

      const map = mapRef.current

      try {
        // Check if source exists - it might not exist if style just changed
        if (!map.getSource('selected-pin-pulse')) {
          return
        }

        const source = map.getSource('selected-pin-pulse') as mapboxgl.GeoJSONSource
        if (!source || typeof source.setData !== 'function') {
          return
        }

        // Find the selected pin
        const selectedPin = pins.find((pin) => pin.selected === true)

        if (selectedPin) {
          // Validate coordinates
          const [lng, lat] = selectedPin.coordinate
          if (
            typeof lng !== 'number' ||
            typeof lat !== 'number' ||
            Number.isNaN(lng) ||
            Number.isNaN(lat) ||
            lng < -180 ||
            lng > 180 ||
            lat < -90 ||
            lat > 90
          ) {
            console.warn('Invalid selected pin coordinates:', selectedPin.coordinate)
            try {
              source.setData({
                type: 'FeatureCollection',
                features: [],
              })
            } catch {
              // Source might be in invalid state, ignore
            }
            return
          }

          // Update source with selected pin location
          try {
            source.setData({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: selectedPin.coordinate,
                  },
                  properties: {
                    id: selectedPin.id,
                  },
                },
              ],
            })
          } catch (e) {
            // Source might be in invalid state during style transition
            console.warn('Failed to update selected pin pulse source:', e)
          }
        } else {
          // No pin selected - clear the source
          try {
            source.setData({
              type: 'FeatureCollection',
              features: [],
            })
          } catch {
            // Source might be in invalid state, ignore
          }
        }
      } catch (error) {
        console.error('Error updating selected pin pulse:', error)
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
