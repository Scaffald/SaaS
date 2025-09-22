'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import { View } from '@app/ui'

import type { TalentMapProps } from './types'
import { createRadiusFeature, radiusToZoomLevel } from './geometry'

const MAP_CONTAINER_STYLE: React.CSSProperties = {
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
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_PUBLIC_TOKEN ?? ''
  }
}

const createMarkerElement = () => {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.style.justifyContent = 'center'
  wrapper.style.width = '44px'
  wrapper.style.height = '44px'
  wrapper.style.borderRadius = '9999px'
  wrapper.style.border = '2px solid rgba(59, 130, 246, 0.6)'
  wrapper.style.background = 'rgba(59, 130, 246, 0.18)'
  wrapper.style.backdropFilter = 'blur(6px)'
  wrapper.style.cursor = 'pointer'
  wrapper.style.transition = 'all 120ms ease'
  wrapper.style.transform = 'translate(-50%, -50%)'
  wrapper.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.2)'

  const metric = document.createElement('span')
  metric.style.fontSize = '13px'
  metric.style.fontWeight = '600'
  metric.style.color = '#1d4ed8'
  metric.dataset.role = 'metric'
  wrapper.appendChild(metric)

  const label = document.createElement('span')
  label.style.fontSize = '11px'
  label.style.color = '#1e293b'
  label.style.whiteSpace = 'nowrap'
  label.style.maxWidth = '90px'
  label.style.textOverflow = 'ellipsis'
  label.style.overflow = 'hidden'
  label.dataset.role = 'label'
  wrapper.appendChild(label)

  return wrapper
}

const updateMarkerElement = (
  element: HTMLElement,
  metric: string | undefined,
  label: string,
  selected: boolean
) => {
  const metricNode = element.querySelector<HTMLElement>('span[data-role="metric"]')
  const labelNode = element.querySelector<HTMLElement>('span[data-role="label"]')

  if (metricNode) {
    metricNode.textContent = metric ?? ''
  }
  if (labelNode) {
    labelNode.textContent = label
  }

  if (selected) {
    element.style.border = '2px solid rgba(30, 64, 175, 0.9)'
    element.style.background = 'rgba(30, 64, 175, 0.2)'
    element.style.boxShadow = '0 10px 28px rgba(30, 64, 175, 0.3)'
  } else {
    element.style.border = '2px solid rgba(59, 130, 246, 0.6)'
    element.style.background = 'rgba(59, 130, 246, 0.18)'
    element.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.2)'
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
  const markersRef = useRef(
    new Map<
      string,
      {
        instance: mapboxgl.Marker
        element: HTMLElement
      }
    >()
  )
  const [isMapReady, setMapReady] = useState(false)

  const radiusFeature = useMemo(() => {
    if (!radiusMeters) return null
    return createRadiusFeature(center, radiusMeters)
  }, [center, radiusMeters])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:
        process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL ??
        process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ??
        'mapbox://styles/mapbox/light-v11',
      center,
      zoom: radiusMeters ? radiusToZoomLevel(radiusMeters) : 7,
      accessToken: mapboxgl.accessToken,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'imperial' }))

    map.on('load', () => {
      setMapReady(true)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.forEach(({ instance }) => instance.remove())
      markersRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const targetZoom = radiusMeters ? radiusToZoomLevel(radiusMeters) : map.getZoom()
    map.flyTo({ center, zoom: targetZoom, speed: 0.9, curve: 1.4, essential: true })
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

  const handleMarkerInteraction = useCallback(
    (id: string) => {
      onMarkerPress?.(id)
    },
    [onMarkerPress]
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map || !isMapReady) return

    const nextIds = new Set(markers.map((marker) => marker.id))

    markersRef.current.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        entry.instance.remove()
        markersRef.current.delete(id)
      }
    })

    markers.forEach((marker) => {
      const existing = markersRef.current.get(marker.id)

      if (!existing) {
        const element = createMarkerElement()
        element.addEventListener('click', () => handleMarkerInteraction(marker.id))
        const instance = new mapboxgl.Marker({
          element,
          anchor: 'bottom',
        })
          .setLngLat(marker.coordinate)
          .addTo(map)

        markersRef.current.set(marker.id, { instance, element })
        updateMarkerElement(element, marker.metric, marker.title, marker.id === selectedMarkerId)
      } else {
        existing.instance.setLngLat(marker.coordinate)
        updateMarkerElement(
          existing.element,
          marker.metric,
          marker.title,
          marker.id === selectedMarkerId
        )
      }
    })
  }, [handleMarkerInteraction, isMapReady, markers, selectedMarkerId])

  return (
    <View flex={1} position="relative" borderRadius="$5" overflow="hidden">
      <div ref={containerRef} style={MAP_CONTAINER_STYLE} />
    </View>
  )
}

export default TalentMap
