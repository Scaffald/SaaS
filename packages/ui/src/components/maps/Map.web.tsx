import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import { View } from 'tamagui'
import { MapMarker, type MapMarkerData } from './MapMarker.web'

import 'mapbox-gl/dist/mapbox-gl.css'

const MAP_CONTAINER_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
}

const EMPTY_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

interface CircleFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  properties: Record<string, unknown>
}

const createCircleFeature = (center: [number, number], radiusMeters: number): CircleFeature => {
  const points = 64
  const coords: number[][] = []
  const distanceX = radiusMeters / (111.32 * 1000 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radiusMeters / (111.32 * 1000)

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([center[0] + x, center[1] + y])
  }
  coords.push(coords[0])

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {},
  }
}

const radiusToZoomLevel = (radiusMeters: number): number => {
  const earthCircumference = 40075017
  const metersPerPixel = (earthCircumference * Math.cos(0)) / 2 ** 20
  const desiredMetersPerPixel = (radiusMeters * 2.5) / 512
  const zoom = Math.log2(metersPerPixel / desiredMetersPerPixel)
  return Math.max(1, Math.min(20, zoom))
}

const ensureAccessToken = () => {
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken =
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_TOKEN ?? ''
  }
}

export interface MapProps {
  center: [number, number]
  markers: MapMarkerData[]
  radiusMeters?: number
  selectedMarkerId?: string | null
  onMarkerPress?: (markerId: string) => void
  style?: CSSProperties
  children?: (props: {
    map: mapboxgl.Map
    markers: MapMarkerData[]
    onSelect: (id: string) => void
  }) => React.ReactNode
}

export const MapComponent = ({
  center,
  markers,
  radiusMeters,
  selectedMarkerId,
  onMarkerPress,
  style,
  children,
}: MapProps) => {
  ensureAccessToken()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isMapReady, setMapReady] = useState(false)

  const radiusFeature = useMemo(() => {
    if (!radiusMeters) return null
    return createCircleFeature(center, radiusMeters)
  }, [center, radiusMeters])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: radiusMeters ? radiusToZoomLevel(radiusMeters) : 7,
      accessToken: mapboxgl.accessToken || '',
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }))

    map.on('load', () => {
      setMapReady(true)
    })

    map.on('error', (e) => {
      if (
        e.error?.message?.includes('featureNamespace') &&
        e.error?.message?.includes('place-labels')
      ) {
        console.warn('Mapbox style warning (non-critical):', e.error.message)
        return
      }
      console.error('Mapbox error:', e.error)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initialCenterRef = useRef(center)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const centerChanged =
      initialCenterRef.current[0] !== center[0] || initialCenterRef.current[1] !== center[1]

    if (centerChanged || radiusMeters) {
      const targetZoom = radiusMeters ? radiusToZoomLevel(radiusMeters) : map.getZoom()
      map.flyTo({ center, zoom: targetZoom, speed: 0.9, curve: 1.4, essential: true })
      initialCenterRef.current = center
    }
  }, [center, radiusMeters])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapReady) return

    const sourceId = 'search-radius'
    const fillLayerId = 'search-radius-fill'
    const outlineLayerId = 'search-radius-outline'

    const ensureSourceAndLayer = () => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: radiusFeature ?? EMPTY_GEOJSON,
        })
      }
      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#2563EB',
            'fill-opacity': 0.15,
          },
        })
      }
      if (!map.getLayer(outlineLayerId)) {
        map.addLayer({
          id: outlineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#1E3A8A',
            'line-width': 1.5,
            'line-opacity': 0.6,
          },
        })
      }
    }

    ensureSourceAndLayer()

    const source = map.getSource(sourceId) as GeoJSONSource | undefined
    if (source) {
      source.setData(radiusFeature ?? EMPTY_GEOJSON)
    }
  }, [radiusFeature, isMapReady])

  const handleMarkerSelect = useCallback(
    (id: string) => {
      onMarkerPress?.(id)
    },
    [onMarkerPress]
  )

  const markersWithSelection = useMemo(
    () =>
      markers.map((marker) => ({
        ...marker,
        isSelected: marker.id === selectedMarkerId,
      })),
    [markers, selectedMarkerId]
  )

  return (
    <View flex={1} position="relative" rounded="$5" overflow="hidden" style={style}>
      <div ref={containerRef} style={MAP_CONTAINER_STYLE} />
      {isMapReady &&
        mapRef.current &&
        (children
          ? children({
              map: mapRef.current,
              markers: markersWithSelection,
              onSelect: handleMarkerSelect,
            })
          : markersWithSelection.map((marker) => (
              <MapMarker
                key={marker.id}
                data={marker}
                map={mapRef.current!}
                onSelect={handleMarkerSelect}
              />
            )))}
    </View>
  )
}
