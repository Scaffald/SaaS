import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react'
import { View } from 'tamagui'
import type { MapContainerProps, MapContainerRef, ViewportBounds } from './types'
import { MapFallback } from './MapFallback'
import { CustomMarker } from './CustomMarker'
import { generateCirclePolygon, validateGeoJSONFeatureCollection } from './utils'

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
      radius,
      centerLocation,
      onPinPress,
      onPinHover,
      onViewportChange,
      onMapReady,
      style,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef(new Map<string, CustomMarker>())
    const cardMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const centerMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(zoom)

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
          // Add clustered source for performance with large datasets
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

          // Don't add a layer for unclustered points - we'll handle them with CustomMarkers
          // This ensures the GeoJSON source only shows clusters, not individual points

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
    }, [center, zoom, onViewportChange, onMapReady])

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

    // Handle pin clicks and empty map clicks
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Check if clicking on a cluster
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        })

        // If not clicking on any feature, deselect
        if (features.length === 0) {
          onPinPress?.(null)
        }
      }

      // Add click handler for empty space
      map.on('click', handleMapClick)

      return () => {
        map.off('click', handleMapClick)
      }
    }, [isMapReady, onPinPress])

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

        // Remove old markers
        for (const marker of markersRef.current.values()) {
          marker.remove()
        }
        markersRef.current.clear()

        const CLUSTER_MAX_ZOOM = 17

        // Update GeoJSON source FIRST so clusters can render
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
              },
            })),
        }

        // Validate GeoJSON before updating
        if (validateGeoJSONFeatureCollection(geojsonData)) {
          const source = map.getSource('pins') as mapboxgl.GeoJSONSource
          if (source) {
            source.setData(geojsonData)
          }
        } else {
          console.warn('Invalid GeoJSON data generated from pins')
        }

        // Wait for clusters to render, then create markers for unclustered pins
        // Use double requestAnimationFrame to ensure clusters are fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const pinsSource = map.getSource('pins') as mapboxgl.GeoJSONSource | null

            // Get all cluster features from the source (more reliable than rendered features)
            let clusterFeatures: Array<{
              coordinates: [number, number]
              clusterId: number
              pointCount: number
            }> = []

            if (pinsSource && currentZoom <= CLUSTER_MAX_ZOOM) {
              try {
                // Query source features to get all clusters
                const bounds = map.getBounds()
                const sourceFeatures = map.querySourceFeatures('pins', {
                  sourceLayer: undefined,
                  filter: ['has', 'point_count'],
                })

                // Extract cluster information
                clusterFeatures = sourceFeatures
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
              } catch (error) {
                console.warn('Failed to query source clusters:', error)
              }
            }

            // Helper to check if a pin is in a cluster
            // Uses queryRenderedFeatures to check if there's a cluster at the pin's screen position
            const isPinInCluster = (pin: (typeof pins)[0]): boolean => {
              if (currentZoom > CLUSTER_MAX_ZOOM || !pinsSource) {
                return false
              }

              try {
                // Project pin to screen coordinates
                const pinPoint = map.project(pin.coordinate)

                // Query for clusters at this screen position (with a small buffer)
                // Clusters have a visual radius, so check within that radius
                const buffer = 50 // pixels - cluster visual radius + buffer
                const bbox: [[number, number], [number, number]] = [
                  [pinPoint.x - buffer, pinPoint.y - buffer],
                  [pinPoint.x + buffer, pinPoint.y + buffer],
                ]

                const featuresAtPin = map.queryRenderedFeatures(bbox, {
                  layers: ['clusters'],
                })

                // If there's a cluster at this position, the pin is in a cluster
                if (featuresAtPin.length > 0) {
                  return true
                }

                return false
              } catch (error) {
                // If query fails, fall back to checking screen distance to cluster centers
                try {
                  const pinPoint = map.project(pin.coordinate)
                  let minScreenDistance = Number.POSITIVE_INFINITY

                  for (const cluster of clusterFeatures) {
                    const clusterPoint = map.project(cluster.coordinates)
                    const screenDistance = Math.sqrt(
                      (pinPoint.x - clusterPoint.x) ** 2 + (pinPoint.y - clusterPoint.y) ** 2
                    )

                    if (screenDistance < minScreenDistance) {
                      minScreenDistance = screenDistance
                    }
                  }

                  // If pin is very close to a cluster center (within 50px), it's likely in the cluster
                  return minScreenDistance < 50
                } catch (fallbackError) {
                  // If all checks fail, assume not clustered to avoid hiding pins incorrectly
                  return false
                }
              }
            }

            // Create new markers only for pins that are NOT in clusters
            for (const pin of pins) {
              // Validate pin data
              if (
                !pin.id ||
                !pin.coordinate ||
                !Array.isArray(pin.coordinate) ||
                pin.coordinate.length !== 2
              ) {
                console.warn('Invalid pin data:', pin)
                continue
              }

              const [lng, lat] = pin.coordinate

              // Validate coordinates
              if (
                typeof lng !== 'number' ||
                typeof lat !== 'number' ||
                Number.isNaN(lng) ||
                Number.isNaN(lat)
              ) {
                console.warn('Invalid pin coordinates:', pin.coordinate)
                continue
              }

              // Check if coordinates are within valid range
              if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                console.warn('Pin coordinates out of range:', pin.coordinate)
                continue
              }

              // Skip if pin is in a cluster
              if (isPinInCluster(pin)) {
                continue
              }

              try {
                const marker = new CustomMarker({
                  pin,
                  onClick: (pinId) => {
                    onPinPress?.(pinId)
                  },
                  onHover: onPinHover,
                  zoom: currentZoom,
                })

                marker.setLngLat(pin.coordinate).addTo(map)
                markersRef.current.set(pin.id, marker)
              } catch (error) {
                console.error('Error creating marker for pin:', pin.id, error)
              }
            }
          })
        })
      } catch (error) {
        console.error('Error updating markers:', error)
      }
    }, [pins, isMapReady, currentZoom, onPinPress, onPinHover])

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
