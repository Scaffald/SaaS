import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useColorScheme, View } from 'react-native'
import type { MapContainerRef, ViewportBounds } from '@scaffald/ui'
import mapboxgl from 'mapbox-gl'

import { PIN_COLORS, type MapPinCategory } from './pinColors'
import { SelectedPinRing, getSelectedPinLabel } from './pins/SelectedPinRing'
import { MapMarkers } from './pins/MapMarkers'
import type { MapPinData } from './pins/MapPin.shared'
import {
  getMapStyleUrl,
  getStandardStyleConfig,
  getStandardStyleConfigIfNeeded,
  shouldApplyStandardConfig,
} from './mapboxStyleConfig'
import { extractViewportBounds, validateGeoJSONFeatureCollection } from './utils'

const logger = {
  error: console.error,
  warn: console.warn,
}

/**
 * Mapbox's stylesheet is injected on demand rather than imported.
 *
 * A static `import 'mapbox-gl/dist/mapbox-gl.css'` gets collected into Metro's
 * global CSS bundle, which the SSR shell then links from *every* page — 40 KB
 * of render-blocking map styling on the marketing landing page, which has no
 * map. Injecting here means only routes that actually mount a map pay for it.
 */
const MAPBOX_CSS_HREF = '/vendor/mapbox-gl.css'

function ensureMapboxStylesheet() {
  if (typeof document === 'undefined') return
  if (document.querySelector(`link[href="${MAPBOX_CSS_HREF}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = MAPBOX_CSS_HREF
  document.head.appendChild(link)
}

// Runs when this module is first evaluated — i.e. when a map-bearing route
// loads its chunk, before any map instance is constructed.
ensureMapboxStylesheet()

// --- Types ---

interface MapPin {
  id: string
  coordinate: [number, number]
  title?: string
  subtitle?: string
  score?: number
  hourlyRate?: number
  payLabel?: string
  availability?: string
  organization?: string
  color?: string
  pinType?: MapPinCategory
  avatarUrl?: string | null
  badges?: unknown[]
  selected?: boolean
  data?: unknown
}

interface ClusterInfo {
  clusterId: number
  coordinates: [number, number]
  pointCount: number
  memberPinIds: string[]
}

export interface MapAdapterProps {
  pins?: unknown[]
  center?: [number, number]
  zoom?: number
  radius?: number
  centerLocation?: [number, number]
  onPinPress?: (id: string | null) => void
  onPinHover?: (id: string | null) => void
  onViewportChange?: (bounds: ViewportBounds) => void
  onMapReady?: (args: { bounds: ViewportBounds; zoom: number }) => void
  onClustersChange?: (clusters: unknown[]) => void
  pinStates?: Map<string, unknown>
  style?: object
}

// --- Constants ---

const PIN_TYPE_ORDER: MapPinCategory[] = ['worker', 'organization', 'job']

const PIN_SOURCE_CONFIGS: Record<
  MapPinCategory,
  {
    sourceId: string
    clusterLayerId: string
    clusterCountLayerId: string
    clusterIdOffset: number
  }
> = {
  worker: {
    sourceId: 'worker-pins',
    clusterLayerId: 'worker-clusters',
    clusterCountLayerId: 'worker-cluster-count',
    clusterIdOffset: 0,
  },
  organization: {
    sourceId: 'organization-pins',
    clusterLayerId: 'organization-clusters',
    clusterCountLayerId: 'organization-cluster-count',
    clusterIdOffset: 1_000_000,
  },
  job: {
    sourceId: 'job-pins',
    clusterLayerId: 'job-clusters',
    clusterCountLayerId: 'job-cluster-count',
    clusterIdOffset: 2_000_000,
  },
}

const clusterLayerIds = PIN_TYPE_ORDER.map((type) => PIN_SOURCE_CONFIGS[type].clusterLayerId)
const layerToPinType = PIN_TYPE_ORDER.reduce<Record<string, MapPinCategory>>((acc, type) => {
  acc[PIN_SOURCE_CONFIGS[type].clusterLayerId] = type
  return acc
}, {})

const CLUSTER_MAX_ZOOM = 14
const CLUSTER_RADIUS_PX = 50

type PinColorMap = Record<MapPinCategory, string>

/**
 * Apply small coordinate jitter to pins sharing the same location within a type group.
 * Spreads duplicates in a circle so they're distinct when zoomed past cluster max zoom.
 */
function jitterCoordinates(pins: MapPin[]): Map<string, [number, number]> {
  const coordGroups = new Map<string, string[]>()
  for (const pin of pins) {
    const key = `${pin.coordinate[0].toFixed(4)},${pin.coordinate[1].toFixed(4)}`
    const group = coordGroups.get(key) ?? []
    group.push(pin.id)
    coordGroups.set(key, group)
  }

  const jittered = new Map<string, [number, number]>()
  const pinById = new Map(pins.map((p) => [p.id, p]))

  for (const ids of coordGroups.values()) {
    if (ids.length <= 1) continue
    const base = pinById.get(ids[0])!.coordinate
    const r = 0.0004 // ~40m, visible only when zoomed in close
    for (let i = 0; i < ids.length; i++) {
      const angle = (i / ids.length) * 2 * Math.PI
      jittered.set(ids[i], [
        base[0] + r * Math.cos(angle),
        base[1] + r * Math.sin(angle),
      ])
    }
  }

  return jittered
}

const determinePinType = (pin: MapPin): MapPinCategory => {
  if (pin.pinType) return pin.pinType
  if (pin.organization === 'Organization') return 'organization'
  if (pin.organization === 'Job') return 'job'
  return 'worker'
}

function applyStandardStyleConfig(
  _map: mapboxgl.Map,
  _themeMode: 'light' | 'dark',
  _styleUrl?: string
) {
  if (!shouldApplyStandardConfig(_styleUrl)) return
  const config = getStandardStyleConfig(_themeMode)
  if (!config) return
  // Mapbox GL JS setConfig API is experimental — skip for now
}

// --- Component ---

export const MapAdapter = forwardRef<MapContainerRef, MapAdapterProps>(
  (
    {
      pins: rawPins,
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
    const colorScheme = useColorScheme()
    const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light'
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const jitteredPinCoordsRef = useRef(new Map<string, [number, number]>())
    const centerMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const selectedRingMarkerRef = useRef<mapboxgl.Marker | null>(null)
    const selectedRingRootRef = useRef<Root | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
    // Pins Mapbox renders as individual (non-clustered) features → ids that should
    // get a React marker. Recomputed on sourcedata / moveend / zoomend.
    const [visiblePinIds, setVisiblePinIds] = useState<Set<string>>(new Set())
    const currentZoomRef = useRef(zoom)
    const zoomRef = useRef(zoom)

    // Cast raw pins
    const pins = (rawPins ?? []) as MapPin[]

    useEffect(() => {
      zoomRef.current = zoom
      currentZoomRef.current = zoom
    }, [zoom])

    const themeMode = resolvedTheme
    const mapStyle = getMapStyleUrl(themeMode)
    const isStyleLoadingRef = useRef(false)
    const latestPinsRef = useRef(pins)
    const pinColors = useMemo<PinColorMap>(() => PIN_COLORS[themeMode], [themeMode])
    const pinColorsRef = useRef(pinColors)
    const currentStyleRef = useRef(mapStyle)
    const onPinPressRef = useRef(onPinPress)
    const onPinHoverRef = useRef(onPinHover)
    const onClustersChangeRef = useRef(onClustersChange)
    const onViewportChangeRef = useRef(onViewportChange)
    const onMapReadyRef = useRef(onMapReady)

    useEffect(() => { latestPinsRef.current = pins }, [pins])
    useEffect(() => { pinColorsRef.current = pinColors }, [pinColors])
    useEffect(() => { onPinPressRef.current = onPinPress }, [onPinPress])
    useEffect(() => { onPinHoverRef.current = onPinHover }, [onPinHover])
    useEffect(() => { onClustersChangeRef.current = onClustersChange }, [onClustersChange])
    useEffect(() => { onViewportChangeRef.current = onViewportChange }, [onViewportChange])
    useEffect(() => { onMapReadyRef.current = onMapReady }, [onMapReady])

    const viewportChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Expose map methods to parent
    useImperativeHandle(
      ref,
      () => ({
        centerOnPin: (pinId: string, options?: { preserveZoom?: boolean }) => {
          const map = mapRef.current
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
          if (map && pin) {
            const currentZoom = map.getZoom()
            const targetZoom =
              options?.preserveZoom === true ? currentZoom : Math.max(currentZoom, 12)
            map.flyTo({ center: pin.coordinate, zoom: targetZoom, speed: 0.8 })
          }
        },
        getPinScreenCoordinates: (pinId: string) => {
          const map = mapRef.current
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
          if (!map || !pin) return undefined
          const point = map.project(pin.coordinate)
          return { x: point.x, y: point.y }
        },
        getContainerRect: () => {
          if (!mapContainerRef.current) return undefined
          return mapContainerRef.current.getBoundingClientRect()
        },
        highlightPin: (pinId: string | null) => {
          const map = mapRef.current
          if (!map) return
          const source = map.getSource('highlighted-pin-ring') as mapboxgl.GeoJSONSource | undefined
          if (!source) return
          if (!pinId) {
            try { source.setData({ type: 'FeatureCollection', features: [] }) } catch { /* */ }
            return
          }
          const pin = latestPinsRef.current.find((p) => p.id === pinId)
          if (!pin) return
          const [lng, lat] = pin.coordinate
          if (!isValidCoord(lng, lat)) return
          try {
            source.setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: pin.coordinate },
                properties: { id: pin.id },
              }],
            })
          } catch { /* */ }
        },
      }),
      []
    )

    // --- Initialize map (runs once on mount) ---
    // biome-ignore lint/correctness/useExhaustiveDependencies: map init must run exactly once
    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return

      if (!mapboxgl.accessToken) {
        mapboxgl.accessToken =
          process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
          process.env.MAPBOX_PUBLIC_TOKEN ??
          ''
      }

      if (!mapboxgl.accessToken) {
        logger.error('No Mapbox access token available')
        return
      }

      try {
        const standardStyleConfig = getStandardStyleConfigIfNeeded(themeMode, mapStyle)
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center,
          zoom,
          attributionControl: false,
          ...(standardStyleConfig ? { config: standardStyleConfig } : {}),
        })

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left')
        map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }), 'bottom-left')

        map.on('load', () => {
          applyStandardStyleConfig(map, themeMode, mapStyle)

          // Add sources and cluster layers for each pin type.
          // Individual pins are rendered as React-component DOM markers in <MapMarkers>;
          // only the cluster bubble + count are drawn as Mapbox layers below.
          for (const type of PIN_TYPE_ORDER) {
            const { sourceId, clusterLayerId, clusterCountLayerId } =
              PIN_SOURCE_CONFIGS[type]

            map.addSource(sourceId, {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
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
              paint: { 'text-color': themeMode === 'dark' ? '#ffffff' : '#0f172a' },
            })
          }

          // Register cluster click handlers
          for (const layerId of clusterLayerIds) {
            const type = layerToPinType[layerId]
            const sourceId = PIN_SOURCE_CONFIGS[type].sourceId

            map.on('click', layerId, (e) => {
              const features = map.queryRenderedFeatures(e.point, { layers: [layerId] })
              if (!features.length) return
              const clusterFeature = features[0]
              const clusterId = clusterFeature.properties?.cluster_id
              if (typeof clusterId !== 'number') return
              const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined
              if (!source) return
              source.getClusterExpansionZoom(clusterId, (err, zoomLevel) => {
                if (err || typeof zoomLevel !== 'number') return
                map.easeTo({
                  center: (clusterFeature.geometry as GeoJSON.Point).coordinates as [number, number],
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

          // Individual pin click/hover is handled by <MapPin> React event handlers.

          // Highlight ring for hovered cards (sidebar → map)
          map.addSource('highlighted-pin-ring', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
          map.addLayer({
            id: 'highlighted-pin-ring-layer',
            type: 'circle',
            source: 'highlighted-pin-ring',
            paint: {
              'circle-radius': 18,
              'circle-color': 'transparent',
              'circle-stroke-width': 3,
              'circle-stroke-color': pinColorsRef.current.worker,
              'circle-stroke-opacity': 0.8,
            },
          })

          // Viewport change tracking (debounced 500ms)
          const handleViewportChangeDebounced = () => {
            if (viewportChangeTimeoutRef.current) {
              clearTimeout(viewportChangeTimeoutRef.current)
            }
            viewportChangeTimeoutRef.current = setTimeout(() => {
              const bounds = extractViewportBounds(map)
              const newZoom = map.getZoom()
              currentZoomRef.current = newZoom
              onViewportChangeRef.current?.(bounds)
            }, 500)
          }

          map.on('moveend', handleViewportChangeDebounced)
          map.on('zoomend', handleViewportChangeDebounced)

          setIsMapReady(true)
          setMapInstance(map)

          if (onMapReadyRef.current) {
            const initialBounds = extractViewportBounds(map)
            const initialZoom = map.getZoom()
            currentZoomRef.current = initialZoom
            onMapReadyRef.current({ bounds: initialBounds, zoom: initialZoom })
          }
        })

        map.on('error', (e) => {
          logger.error('Mapbox error', e.error)
        })

        mapRef.current = map

        return () => {
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
          }
        }
      } catch (error) {
        logger.error('Map initialization failed', error)
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // --- Update map style when theme changes ---
    useEffect(() => {
      const map = mapRef.current
      if (!map || !isMapReady) return
      if (currentStyleRef.current === mapStyle) return

      currentStyleRef.current = mapStyle
      isStyleLoadingRef.current = true
      map.setStyle(mapStyle)

      const handleStyleData = () => {
        isStyleLoadingRef.current = false
        applyStandardStyleConfig(map, themeMode, mapStyle)

        for (const type of PIN_TYPE_ORDER) {
          const { sourceId, clusterLayerId, clusterCountLayerId } = PIN_SOURCE_CONFIGS[type]

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
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
              paint: { 'text-color': themeMode === 'dark' ? '#ffffff' : '#0f172a' },
            })
          }
        }

        // Re-add highlight ring
        if (!map.getSource('highlighted-pin-ring')) {
          map.addSource('highlighted-pin-ring', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          })
        }
        if (!map.getLayer('highlighted-pin-ring-layer')) {
          map.addLayer({
            id: 'highlighted-pin-ring-layer',
            type: 'circle',
            source: 'highlighted-pin-ring',
            paint: {
              'circle-radius': 18,
              'circle-color': 'transparent',
              'circle-stroke-width': 3,
              'circle-stroke-color': pinColorsRef.current.worker,
              'circle-stroke-opacity': 0.8,
            },
          })
        }

      }

      map.once('styledata', handleStyleData)
      return () => { map.off('styledata', handleStyleData) }
    }, [mapStyle, isMapReady, themeMode])

    // --- Handle resize ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current

      const handleResize = () => {
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
        resizeTimeoutRef.current = setTimeout(() => {
          try { map.resize() } catch { /* ignore */ }
        }, 150)
      }

      window.addEventListener('resize', handleResize)
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

    // --- Update pin data on GeoJSON sources ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current

      try {
        if (!Array.isArray(pins)) return

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
          if (!source) continue

          const jitteredCoords = jitterCoordinates(pinsByType[type])
          for (const [id, coord] of jitteredCoords) {
            jitteredPinCoordsRef.current.set(id, coord)
          }

          // Features only need an id + coordinate — Mapbox uses them solely for
          // clustering math; rendering is done by <MapMarkers /> React components.
          const features: GeoJSON.Feature<GeoJSON.Point>[] = pinsByType[type].map((pin) => {
            const coord = jitteredCoords.get(pin.id) ?? pin.coordinate
            return {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: coord },
              properties: { id: pin.id },
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
              logger.warn(`Error updating ${type} pins source`, error)
            }
          }
        }

        // Extract cluster info
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
                if (!pinsSource) continue

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
                } catch { /* ignore */ }
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
                  continue
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
            } catch {
              onClustersChangeRef.current?.([])
            }
          })
        })

      } catch (error) {
        logger.error('Error updating markers', error)
      }
    }, [pins, isMapReady, themeMode])

    // --- Handle empty map clicks (deselect) ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        // Clicks on React pin markers don't reach the Mapbox canvas (DOM markers
        // sit above and stopPropagation themselves), so we only need to ignore
        // clicks that hit a Mapbox-rendered cluster layer or the highlight ring.
        const features = map.queryRenderedFeatures(e.point, {
          layers: [...clusterLayerIds, 'highlighted-pin-ring-layer'],
        })
        if (features.length === 0) {
          onPinPressRef.current?.(null)
        }
      }

      map.on('click', handleMapClick)
      return () => { map.off('click', handleMapClick) }
    }, [isMapReady])

    // --- Remove radius circle if exists ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current
      try {
        if (map.getLayer('circle-fill')) map.removeLayer('circle-fill')
        if (map.getLayer('circle-outline')) map.removeLayer('circle-outline')
        if (map.getSource('locationCircle')) map.removeSource('locationCircle')
      } catch { /* ignore */ }
    }, [isMapReady])

    // --- Update center location marker ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady || !centerLocation) {
        if (centerMarkerRef.current) {
          centerMarkerRef.current.remove()
          centerMarkerRef.current = null
        }
        return
      }

      const map = mapRef.current

      try {
        const [lng, lat] = centerLocation
        if (!isValidCoord(lng, lat)) return

        if (centerMarkerRef.current) centerMarkerRef.current.remove()

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
      } catch { /* ignore */ }
    }, [centerLocation, isMapReady])

    // --- Selected pin React marker (CSS-animated ring matching pin shape) ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current

      const selectedPin = pins.find((pin) => pin.selected === true)

      // Tear down when nothing is selected
      if (!selectedPin) {
        if (selectedRingRootRef.current) {
          const root = selectedRingRootRef.current
          selectedRingRootRef.current = null
          queueMicrotask(() => { try { root.unmount() } catch { /* ignore */ } })
        }
        if (selectedRingMarkerRef.current) {
          try { selectedRingMarkerRef.current.remove() } catch { /* ignore */ }
          selectedRingMarkerRef.current = null
        }
        return
      }

      const coord = jitteredPinCoordsRef.current.get(selectedPin.id) ?? selectedPin.coordinate
      const [lng, lat] = coord
      if (!isValidCoord(lng, lat)) return

      const { label, isAvatar, pinType } = getSelectedPinLabel(selectedPin)
      const hasIcon = !isAvatar

      const ringNode = (
        <SelectedPinRing
          label={label}
          pinType={pinType}
          theme={themeMode}
          hasIcon={hasIcon}
          isAvatar={isAvatar}
        />
      )

      // Create marker + React root on first selection
      if (!selectedRingMarkerRef.current) {
        const el = document.createElement('div')
        el.style.position = 'absolute'
        el.style.pointerEvents = 'none'
        const root = createRoot(el)
        root.render(ringNode)
        selectedRingRootRef.current = root
        selectedRingMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coord)
          .addTo(map)
        return
      }

      // Update existing marker
      selectedRingMarkerRef.current.setLngLat(coord)
      selectedRingRootRef.current?.render(ringNode)
    }, [pins, isMapReady, themeMode])

    // Cleanup React root on unmount
    useEffect(() => {
      return () => {
        if (selectedRingRootRef.current) {
          const root = selectedRingRootRef.current
          selectedRingRootRef.current = null
          queueMicrotask(() => { try { root.unmount() } catch { /* ignore */ } })
        }
        if (selectedRingMarkerRef.current) {
          try { selectedRingMarkerRef.current.remove() } catch { /* ignore */ }
          selectedRingMarkerRef.current = null
        }
      }
    }, [])

    // --- Fly to center when centerLocation changes ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady || !centerLocation) return
      const [lng, lat] = centerLocation
      if (!isValidCoord(lng, lat)) return
      mapRef.current.flyTo({ center: centerLocation, zoom: 12, speed: 0.8 })
    }, [centerLocation, isMapReady])

    // --- Track which pin IDs Mapbox treats as unclustered (→ get a React marker) ---
    useEffect(() => {
      if (!mapRef.current || !isMapReady) return
      const map = mapRef.current

      let scheduled = false
      const recompute = () => {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(() => {
          scheduled = false
          if (!map.isStyleLoaded()) return
          const ids = new Set<string>()
          for (const type of PIN_TYPE_ORDER) {
            const sourceId = PIN_SOURCE_CONFIGS[type].sourceId
            if (!map.getSource(sourceId)) continue
            try {
              const feats = map.querySourceFeatures(sourceId, {
                filter: ['!', ['has', 'point_count']],
              })
              for (const f of feats) {
                const id = f.properties?.id
                if (typeof id === 'string') ids.add(id)
              }
            } catch { /* ignore */ }
          }
          setVisiblePinIds((prev) => {
            if (prev.size === ids.size) {
              let same = true
              for (const id of ids) {
                if (!prev.has(id)) { same = false; break }
              }
              if (same) return prev
            }
            return ids
          })
        })
      }

      map.on('sourcedata', recompute)
      map.on('moveend', recompute)
      map.on('zoomend', recompute)
      recompute()

      return () => {
        map.off('sourcedata', recompute)
        map.off('moveend', recompute)
        map.off('zoomend', recompute)
      }
    }, [isMapReady])

    // Per-pin event callbacks routed through the existing ref-stable handlers.
    const handlePinPress = useMemo(
      () => (id: string) => onPinPressRef.current?.(id),
      [],
    )
    const handlePinHoverEnter = useMemo(
      () => (id: string) => onPinHoverRef.current?.(id),
      [],
    )
    const handlePinHoverLeave = useMemo(
      () => () => onPinHoverRef.current?.(null),
      [],
    )

    return (
      <View style={[{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 20 }, style]}>
        <MapMarkers
          map={mapInstance}
          pins={pins as MapPinData[]}
          jitteredCoords={jitteredPinCoordsRef.current}
          visiblePinIds={visiblePinIds}
          theme={themeMode}
          onPinPress={handlePinPress}
          onPinHoverEnter={handlePinHoverEnter}
          onPinHoverLeave={handlePinHoverLeave}
        />
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    )
  }
)

MapAdapter.displayName = 'MapAdapter'

function isValidCoord(lng: number, lat: number): boolean {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !Number.isNaN(lng) &&
    !Number.isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  )
}
