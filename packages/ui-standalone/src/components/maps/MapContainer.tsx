import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View } from 'tamagui'
// useThemeSetting has domain dependencies - use tamagui's useThemeName instead
import { useThemeName } from 'tamagui'
import {
  purpleDark,
  purpleLight,
  tealDark,
  tealLight,
  yellowDark,
  yellowLight,
} from '../../themes/scaffald-theme'
import type { CustomMarker } from './CustomMarker'
import {
  getMapStyleUrl,
  getStandardStyleConfig,
  getStandardStyleConfigIfNeeded,
  shouldApplyStandardConfig,
} from './mapboxStyleConfig'
import { createPulsingDot } from './PulsingDot'
import type {
  ClusterInfo,
  MapContainerProps,
  MapContainerRef,
  MapPin,
  MapPinCategory,
} from './types'
import { extractViewportBounds, validateGeoJSONFeatureCollection } from './utils'

import 'mapbox-gl/dist/mapbox-gl.css'

// Import mapboxgl with proper typing
import mapboxgl from 'mapbox-gl'

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

const PIN_TYPE_ORDER: MapPinCategory[] = ['worker', 'organization', 'job']

const PIN_SOURCE_CONFIGS: Record<
  MapPinCategory,
  {
    sourceId: string
    clusterLayerId: string
    clusterCountLayerId: string
    pointLayerId: string
    avatarLayerId?: string
    clusterIdOffset: number
  }
> = {
  worker: {
    sourceId: 'worker-pins',
    clusterLayerId: 'worker-clusters',
    clusterCountLayerId: 'worker-cluster-count',
    pointLayerId: 'worker-unclustered',
    avatarLayerId: 'worker-avatar-layer',
    clusterIdOffset: 0,
  },
  organization: {
    sourceId: 'organization-pins',
    clusterLayerId: 'organization-clusters',
    clusterCountLayerId: 'organization-cluster-count',
    pointLayerId: 'organization-unclustered',
    clusterIdOffset: 1_000_000,
  },
  job: {
    sourceId: 'job-pins',
    clusterLayerId: 'job-clusters',
    clusterCountLayerId: 'job-cluster-count',
    pointLayerId: 'job-unclustered',
    clusterIdOffset: 2_000_000,
  },
}

const clusterLayerIds = PIN_TYPE_ORDER.map((type) => PIN_SOURCE_CONFIGS[type].clusterLayerId)
const pointLayerIds = PIN_TYPE_ORDER.map((type) => PIN_SOURCE_CONFIGS[type].pointLayerId)
const avatarLayerIds = PIN_TYPE_ORDER.map((type) => PIN_SOURCE_CONFIGS[type].avatarLayerId).filter(
  (id): id is string => Boolean(id)
)
const layerToPinType = PIN_TYPE_ORDER.reduce<Record<string, MapPinCategory>>((acc, type) => {
  const config = PIN_SOURCE_CONFIGS[type]
  acc[config.clusterLayerId] = type
  acc[config.pointLayerId] = type
  if (config.avatarLayerId) {
    acc[config.avatarLayerId] = type
  }
  return acc
}, {})

const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS_PX = 50
const AVATAR_IMAGE_PREFIX = 'avatar-pin'
const AVATAR_BASE_SIZE = 96
const AVATAR_BORDER_WIDTH = 6

type PinColorMap = Record<MapPinCategory, string>

const determinePinType = (pin: MapPin): MapPinCategory => {
  if (pin.pinType) {
    return pin.pinType
  }

  if (pin.organization === 'Organization') {
    return 'organization'
  }

  if (pin.organization === 'Job') {
    return 'job'
  }

  return 'worker'
}

const createAvatarCanvas = (
  url: string,
  {
    size = AVATAR_BASE_SIZE,
    borderColor = '#ffffff',
    borderWidth = AVATAR_BORDER_WIDTH,
  }: { size?: number; borderColor?: string; borderWidth?: number }
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Unable to acquire 2D context for avatar canvas'))
        return
      }

      const radius = size / 2

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.beginPath()
      ctx.arc(radius, radius, radius - borderWidth, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(image, 0, 0, size, size)
      ctx.restore()

      ctx.lineWidth = borderWidth
      ctx.strokeStyle = borderColor
      ctx.beginPath()
      ctx.arc(radius, radius, radius - borderWidth / 2, 0, Math.PI * 2)
      ctx.stroke()

      resolve(canvas)
    }
    image.onerror = (error) => {
      reject(error)
    }
    image.src = url
  })
}

function applyStandardStyleConfig(
  _map: mapboxgl.Map,
  _themeMode: 'light' | 'dark',
  _styleUrl?: string
) {
  if (!shouldApplyStandardConfig(_styleUrl)) {
    return
  }

  const config = getStandardStyleConfig(_themeMode)
  if (!config) {
    return
  }

  // Mapbox GL JS' experimental setConfig API behaves inconsistently across styles.
  // Avoid calling it until a stable API is available.
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  (
    {
      pins,
      center = [-84.5555, 42.7325],
      zoom = 7,
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
    const themeName = useThemeName()
    const resolvedTheme = themeName?.includes('dark') ? 'dark' : 'light'
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef(new Map<string, CustomMarker>())
    const avatarImageCacheRef = useRef(new Map<string, { url: string; borderColor: string }>())
    const loadingAvatarIdsRef = useRef(new Set<string>())
    const cardMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const centerMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const currentZoomRef = useRef(zoom)
    const zoomRef = useRef(zoom)

    useEffect(() => {
      zoomRef.current = zoom
      currentZoomRef.current = zoom
    }, [zoom])

    // Determine map style based on app theme
    const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
    const mapStyle = getMapStyleUrl(themeMode)
    const isStyleLoadingRef = useRef(false)
    const latestPinsRef = useRef(pins)
    const pinColors = useMemo<PinColorMap>(() => {
      const isDark = resolvedTheme === 'dark'
      return {
        worker: isDark ? tealDark.teal9 : tealLight.teal9,
        organization: isDark ? purpleDark.purple9 : purpleLight.purple9,
        job: isDark ? yellowDark.yellow9 : yellowLight.yellow9,
      }
    }, [resolvedTheme])
    const pinColorsRef = useRef(pinColors)
    const currentStyleRef = useRef(mapStyle)
    const onPinPressRef = useRef(onPinPress)
    const onPinHoverRef = useRef(onPinHover)
    const onClustersChangeRef = useRef(onClustersChange)
    const onViewportChangeRef = useRef(onViewportChange)
    const onMapReadyRef = useRef(onMapReady)

    useEffect(() => {
      latestPinsRef.current = pins
    }, [pins])

    useEffect(() => {
      pinColorsRef.current = pinColors
    }, [pinColors])

    useEffect(() => {
      onPinPressRef.current = onPinPress
    }, [onPinPress])

    useEffect(() => {
      onPinHoverRef.current = onPinHover
    }, [onPinHover])

    useEffect(() => {
      onClustersChangeRef.current = onClustersChange
    }, [onClustersChange])

    useEffect(() => {
      onViewportChangeRef.current = onViewportChange
    }, [onViewportChange])

    useEffect(() => {
      onMapReadyRef.current = onMapReady
    }, [onMapReady])

    // Viewport change handler ref for debouncing
    const viewportChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Resize handler ref for debouncing
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Expose map methods to parent
    useImperativeHandle(
      ref,
      () => ({
        flyTo: (newCenter: [number, number], newZoom = zoomRef.current) => {
          const map = mapRef.current
          if (map?.flyTo) {
            map.flyTo({
              center: newCenter,
              zoom: newZoom,
              speed: 0.8,
            })
          }
        },
        centerOnPin: (pinId: string, options?: { preserveZoom?: boolean }) => {
          const map = mapRef.current
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
          if (map && pin) {
            const currentZoom = map.getZoom()
            const targetZoom =
              options?.preserveZoom === true ? currentZoom : Math.max(currentZoom, 12)
            map.flyTo({
              center: pin.coordinate,
              zoom: targetZoom,
              speed: 0.8,
            })
          }
        },
        getPinScreenCoordinates: (pinId: string) => {
          const map = mapRef.current
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
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
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
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
        getContainerRect: () => {
          if (!mapContainerRef.current) {
            return null
          }
          return mapContainerRef.current.getBoundingClientRect()
        },
      }),
      []
    )

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
        const standardStyleConfig = getStandardStyleConfigIfNeeded(themeMode, mapStyle)
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center,
          zoom,
          attributionControl: false,
          ...(standardStyleConfig ? { config: standardStyleConfig } : {}),
        })

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }))

        map.on('load', () => {
          applyStandardStyleConfig(map, themeMode, mapStyle)

          for (const type of PIN_TYPE_ORDER) {
            const { sourceId, clusterLayerId, clusterCountLayerId, pointLayerId, avatarLayerId } =
              PIN_SOURCE_CONFIGS[type]

            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
              cluster: true,
              clusterMaxZoom: CLUSTER_MAX_ZOOM,
              clusterRadius: CLUSTER_RADIUS_PX,
              generateId: true,
            })

            map.addLayer({
              id: clusterLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': pinColorsRef.current[type],
                'circle-radius': ['step', ['get', 'point_count'], 30, 100, 45, 750, 60],
                'circle-opacity': 0.9,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
                'circle-emissive-strength': 1,
              },
            })

            map.addLayer({
              id: clusterCountLayerId,
              type: 'symbol',
              source: sourceId,
              filter: ['has', 'point_count'],
              layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12,
              },
              paint: {
                'text-color': '#0f172a',
              },
            })

            map.addLayer({
              id: pointLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['all', ['!', ['has', 'point_count']], ['!', ['has', 'avatarImageId']]],
              paint: {
                'circle-color': pinColorsRef.current[type],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-emissive-strength': 1,
              },
            })

            if (avatarLayerId) {
              map.addLayer({
                id: avatarLayerId,
                type: 'symbol',
                source: sourceId,
                filter: ['all', ['!', ['has', 'point_count']], ['has', 'avatarImageId']],
                layout: {
                  'icon-image': ['get', 'avatarImageId'],
                  'icon-size': 0.55,
                  'icon-anchor': 'bottom',
                  'icon-offset': [0, -6],
                  'icon-allow-overlap': true,
                },
              })
            }
          }

          const registerClusterHandlers = (layerId: string, sourceId: string) => {
            map.on('click', layerId, (e) => {
              const features = map.queryRenderedFeatures(e.point, {
                layers: [layerId],
              })
              if (!features.length) {
                return
              }
              const clusterFeature = features[0]
              const clusterId = clusterFeature.properties?.cluster_id
              if (typeof clusterId !== 'number') {
                return
              }
              const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined
              if (!source) {
                return
              }
              source.getClusterExpansionZoom(clusterId, (err, zoomLevel) => {
                if (err || typeof zoomLevel !== 'number') return
                map.easeTo({
                  center: (clusterFeature.geometry as GeoJSON.Point).coordinates as [
                    number,
                    number,
                  ],
                  zoom: zoomLevel,
                })
              })
            })

            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer'
            })
            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = ''
            })
          }

          for (const layerId of clusterLayerIds) {
            const type = layerToPinType[layerId]
            const sourceId = PIN_SOURCE_CONFIGS[type].sourceId
            registerClusterHandlers(layerId, sourceId)
          }

          const interactivePointLayers = [...pointLayerIds, ...avatarLayerIds]

          for (const layerId of interactivePointLayers) {
            map.on('click', layerId, (e) => {
              const pinId = e.features?.[0]?.properties?.id
              if (pinId) {
                onPinPressRef.current?.(pinId)
              }
            })

            map.on('mouseenter', layerId, (e) => {
              map.getCanvas().style.cursor = 'pointer'
              const pinId = e.features?.[0]?.properties?.id
              if (pinId) {
                onPinHoverRef.current?.(pinId)
              }
            })

            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = ''
              onPinHoverRef.current?.(null)
            })
          }

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
          if (onViewportChangeRef.current) {
            const handleViewportChangeDebounced = () => {
              // Clear existing timeout
              if (viewportChangeTimeoutRef.current) {
                clearTimeout(viewportChangeTimeoutRef.current)
              }

              // Set new timeout
              viewportChangeTimeoutRef.current = setTimeout(() => {
                const bounds = extractViewportBounds(map)
                const newZoom = map.getZoom()
                currentZoomRef.current = newZoom
                onViewportChangeRef.current?.(bounds, newZoom)
              }, 500)
            }

            map.on('moveend', handleViewportChangeDebounced)
            map.on('zoomend', handleViewportChangeDebounced)
          }

          setIsMapReady(true)

          if (onMapReadyRef.current) {
            const initialBounds = extractViewportBounds(map)
            const initialZoom = map.getZoom()
            currentZoomRef.current = initialZoom
            onMapReadyRef.current({
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
    }, [center, zoom, mapStyle, themeMode])

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
        applyStandardStyleConfig(map, themeMode, mapStyle)

        for (const type of PIN_TYPE_ORDER) {
          const { sourceId, clusterLayerId, clusterCountLayerId, pointLayerId, avatarLayerId } =
            PIN_SOURCE_CONFIGS[type]

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: [],
              },
              cluster: true,
              clusterMaxZoom: CLUSTER_MAX_ZOOM,
              clusterRadius: CLUSTER_RADIUS_PX,
              generateId: true,
            })
          }

          if (!map.getLayer(clusterLayerId)) {
            map.addLayer({
              id: clusterLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': pinColorsRef.current[type],
                'circle-radius': ['step', ['get', 'point_count'], 30, 100, 45, 750, 60],
                'circle-opacity': 0.9,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
                'circle-emissive-strength': 1,
              },
            })
          }

          if (!map.getLayer(clusterCountLayerId)) {
            map.addLayer({
              id: clusterCountLayerId,
              type: 'symbol',
              source: sourceId,
              filter: ['has', 'point_count'],
              layout: {
                'text-field': ['get', 'point_count_abbreviated'],
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12,
              },
              paint: {
                'text-color': '#0f172a',
              },
            })
          }

          if (!map.getLayer(pointLayerId)) {
            map.addLayer({
              id: pointLayerId,
              type: 'circle',
              source: sourceId,
              filter: ['all', ['!', ['has', 'point_count']], ['!', ['has', 'avatarImageId']]],
              paint: {
                'circle-color': pinColorsRef.current[type],
                'circle-radius': 6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-emissive-strength': 1,
              },
            })
          }

          if (avatarLayerId && !map.getLayer(avatarLayerId)) {
            map.addLayer({
              id: avatarLayerId,
              type: 'symbol',
              source: sourceId,
              filter: ['all', ['!', ['has', 'point_count']], ['has', 'avatarImageId']],
              layout: {
                'icon-image': ['get', 'avatarImageId'],
                'icon-size': 0.55,
                'icon-anchor': 'bottom',
                'icon-offset': [0, -6],
                'icon-allow-overlap': true,
              },
            })
          }
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
    }, [mapStyle, isMapReady, themeMode])

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

    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      try {
        if (!Array.isArray(pins)) {
          console.warn('Invalid pins data: expected array')
          return
        }

        const pinsByType: Record<MapPinCategory, MapPin[]> = {
          worker: [],
          organization: [],
          job: [],
        }

        for (const pin of pins) {
          if (
            pin.id &&
            pin.coordinate &&
            Array.isArray(pin.coordinate) &&
            pin.coordinate.length === 2 &&
            typeof pin.coordinate[0] === 'number' &&
            typeof pin.coordinate[1] === 'number' &&
            !Number.isNaN(pin.coordinate[0]) &&
            !Number.isNaN(pin.coordinate[1])
          ) {
            const type = determinePinType(pin)
            pinsByType[type].push(pin)
          }
        }

        for (const type of PIN_TYPE_ORDER) {
          const source = map.getSource(
            PIN_SOURCE_CONFIGS[type].sourceId
          ) as mapboxgl.GeoJSONSource | null
          if (!source) {
            return
          }

          const features: GeoJSON.Feature<GeoJSON.Point>[] = pinsByType[type].map((pin) => {
            const baseProperties: Record<string, unknown> = {
              id: pin.id,
              title: pin.title,
              subtitle: pin.subtitle,
              availability: pin.availability,
              organization: pin.organization,
            }

            if (type === 'worker' && pin.avatarUrl) {
              baseProperties.avatarImageId = `${AVATAR_IMAGE_PREFIX}-${pin.id}`
            }

            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: pin.coordinate,
              },
              properties: baseProperties,
            }
          })

          const geojsonData: GeoJSON.FeatureCollection = {
            type: 'FeatureCollection',
            features,
          }

          if (validateGeoJSONFeatureCollection(geojsonData)) {
            try {
              source.setData(geojsonData)
            } catch (error) {
              console.warn(`Error updating ${type} pins source:`, error)
            }
          } else {
            console.warn(`Invalid GeoJSON data generated from ${type} pins`)
          }
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              const notifyClusters = (clusters: ClusterInfo[]) => {
                onClustersChangeRef.current?.(clusters)
              }

              if (!map.isStyleLoaded() || !map.loaded()) {
                notifyClusters([])
                return
              }

              if (currentZoomRef.current > CLUSTER_MAX_ZOOM) {
                notifyClusters([])
                return
              }

              const clusterInfos: ClusterInfo[] = []
              const clusterTasks: Array<{
                type: MapPinCategory
                clusterId: number
                pointCount: number
                coordinates: [number, number]
              }> = []

              for (const type of PIN_TYPE_ORDER) {
                const sourceId = PIN_SOURCE_CONFIGS[type].sourceId
                const pinsSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource | null
                if (!pinsSource) {
                  return
                }

                try {
                  const sourceFeatures = map.querySourceFeatures(sourceId, {
                    sourceLayer: undefined,
                    filter: ['has', 'point_count'],
                  })

                  for (const feature of sourceFeatures) {
                    if (feature.geometry.type === 'Point' && feature.properties?.cluster_id) {
                      clusterTasks.push({
                        type,
                        clusterId: feature.properties.cluster_id as number,
                        pointCount: (feature.properties.point_count as number) || 0,
                        coordinates: feature.geometry.coordinates as [number, number],
                      })
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to query clusters for source ${sourceId}:`, error)
                }
              }

              if (clusterTasks.length === 0) {
                notifyClusters([])
                return
              }

              let processedClusters = 0
              const totalClusters = clusterTasks.length

              const finishIfDone = () => {
                if (processedClusters === totalClusters) {
                  notifyClusters(clusterInfos)
                }
              }

              for (const { type, clusterId, pointCount, coordinates } of clusterTasks) {
                const source = map.getSource(
                  PIN_SOURCE_CONFIGS[type].sourceId
                ) as mapboxgl.GeoJSONSource | null
                if (!source) {
                  processedClusters++
                  finishIfDone()
                  return
                }

                source.getClusterLeaves(clusterId, Number.MAX_SAFE_INTEGER, 0, (err, leaves) => {
                  if (!err && leaves) {
                    const memberPinIds = leaves
                      .map((leaf) => leaf.properties?.id as string)
                      .filter((id): id is string => typeof id === 'string')

                    clusterInfos.push({
                      clusterId: clusterId + PIN_SOURCE_CONFIGS[type].clusterIdOffset,
                      coordinates,
                      pointCount,
                      memberPinIds,
                    })
                  }

                  processedClusters++
                  finishIfDone()
                })
              }
            } catch (error) {
              console.warn('Error processing clusters:', error)
              onClustersChangeRef.current?.([])
            }
          })
        })

        for (const [pinId, marker] of markersRef.current.entries()) {
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
    }, [pins, isMapReady])

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
          layers: [
            ...clusterLayerIds,
            ...pointLayerIds,
            ...avatarLayerIds,
            'selected-pin-pulse-layer',
          ],
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

    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current
      let isCancelled = false

      const workerPinsWithAvatars = pins.filter(
        (pin) =>
          determinePinType(pin) === 'worker' && typeof pin.avatarUrl === 'string' && pin.avatarUrl
      )

      const activeImageIds = new Set(
        workerPinsWithAvatars.map((pin) => `${AVATAR_IMAGE_PREFIX}-${pin.id}`)
      )

      for (const [imageId, metadata] of avatarImageCacheRef.current.entries()) {
        if (!activeImageIds.has(imageId) || metadata.borderColor !== pinColors.worker) {
          if (map.hasImage(imageId)) {
            map.removeImage(imageId)
          }
          avatarImageCacheRef.current.delete(imageId)
        }
      }

      for (const pin of workerPinsWithAvatars) {
        const imageId = `${AVATAR_IMAGE_PREFIX}-${pin.id}`
        const currentEntry = avatarImageCacheRef.current.get(imageId)
        const nextUrl = pin.avatarUrl as string

        if (
          currentEntry &&
          currentEntry.url === nextUrl &&
          currentEntry.borderColor === pinColors.worker &&
          map.hasImage(imageId)
        ) {
          return
        }

        if (loadingAvatarIdsRef.current.has(imageId)) {
          return
        }

        loadingAvatarIdsRef.current.add(imageId)

        createAvatarCanvas(nextUrl, { borderColor: pinColors.worker })
          .then((canvas) => {
            if (isCancelled) {
              return
            }

            if (map.hasImage(imageId)) {
              map.removeImage(imageId)
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.addImage(imageId, canvas as any, { pixelRatio: 2 })
            avatarImageCacheRef.current.set(imageId, {
              url: nextUrl,
              borderColor: pinColors.worker,
            })
          })
          .catch((error) => {
            console.warn('Failed to load avatar marker image:', error)
            avatarImageCacheRef.current.delete(imageId)
          })
          .finally(() => {
            loadingAvatarIdsRef.current.delete(imageId)
          })
      }

      return () => {
        isCancelled = true
      }
    }, [pins, isMapReady, pinColors.worker, mapStyle])

    // Pin states are now handled by Mapbox layers
    // Opacity and visibility can be controlled via layer paint properties if needed
    // For now, we rely on the layer-based rendering which is more performant

    // Remove radius circle if it exists (radius circle display disabled)
    useEffect(() => {
      if (!mapRef.current || !isMapReady) {
        return
      }

      const map = mapRef.current

      try {
        // Remove circle layers if they exist
        if (map.getLayer('circle-fill')) {
          map.removeLayer('circle-fill')
        }
        if (map.getLayer('circle-outline')) {
          map.removeLayer('circle-outline')
        }

        // Remove circle source if it exists
        if (map.getSource('locationCircle')) {
          map.removeSource('locationCircle')
        }
      } catch {
        // Ignore errors if layers/source don't exist
        // This is expected on first render or if already cleaned up
      }
    }, [isMapReady])

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
