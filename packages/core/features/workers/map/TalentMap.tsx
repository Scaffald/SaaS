import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import { View } from '@app/ui'

import type { TalentMapProps } from './types'
import { createRadiusFeature, radiusToZoomLevel } from './geometry'
import { MapMarker } from './MapMarker'

const MAP_CONTAINER_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
}

const EMPTY_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const ensureAccessToken = () => {
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken =
      process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_TOKEN ?? ''
  }
}

export const TalentMap = ({
  center,
  markers,
  radiusMeters,
  selectedMarkerId,
  onMarkerPress,
}: TalentMapProps) => {
  ensureAccessToken()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isMapReady, setMapReady] = useState(false)

  const radiusFeature = useMemo(() => {
    if (!radiusMeters) return null
    return createRadiusFeature(center, radiusMeters)
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

    // Suppress non-critical Mapbox style warnings
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

  // Track initial center to prevent unnecessary map movements
  const initialCenterRef = useRef(center)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Only fly to new location if center or radius actually changed
    // Don't trigger on other re-renders (like selection changes)
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

  return (
    <View flex={1} position="relative" rounded="$5" overflow="hidden">
      <div ref={containerRef} style={MAP_CONTAINER_STYLE} />
      {isMapReady &&
        mapRef.current &&
        markers.map((marker) => (
          <MapMarker
            key={marker.id}
            marker={marker}
            map={mapRef.current!}
            isSelected={marker.id === selectedMarkerId}
            onSelect={handleMarkerSelect}
          />
        ))}
    </View>
  )
}

export default TalentMap
