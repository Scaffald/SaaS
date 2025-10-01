import { useCallback, useEffect, useMemo, useRef, useState, CSSProperties } from 'react'
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl'
import type { FeatureCollection } from 'geojson'
import { View } from '@app/ui'
import { MapPin, User, Building } from '@tamagui/lucide-icons'

import type { TalentMapProps, TalentMarker } from './types'
import { createRadiusFeature, radiusToZoomLevel } from './geometry'

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

const createTooltipElement = (marker: TalentMarker) => {
  const tooltip = document.createElement('div')
  tooltip.style.position = 'absolute'
  tooltip.style.bottom = '60px'
  tooltip.style.left = '50%'
  tooltip.style.transform = 'translateX(-50%)'
  tooltip.style.background = 'rgba(0, 0, 0, 0.9)'
  tooltip.style.color = '#FFFFFF'
  tooltip.style.padding = '12px 16px'
  tooltip.style.borderRadius = '12px'
  tooltip.style.fontSize = '14px'
  tooltip.style.lineHeight = '1.4'
  tooltip.style.fontFamily = 'system-ui, -apple-system, sans-serif'
  tooltip.style.whiteSpace = 'nowrap'
  tooltip.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
  tooltip.style.backdropFilter = 'blur(8px)'
  tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)'
  tooltip.style.opacity = '0'
  tooltip.style.visibility = 'hidden'
  tooltip.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
  tooltip.style.zIndex = '1000'
  tooltip.style.pointerEvents = 'none'

  // Create arrow
  const arrow = document.createElement('div')
  arrow.style.position = 'absolute'
  arrow.style.top = '100%'
  arrow.style.left = '50%'
  arrow.style.transform = 'translateX(-50%)'
  arrow.style.width = '0'
  arrow.style.height = '0'
  arrow.style.borderLeft = '8px solid transparent'
  arrow.style.borderRight = '8px solid transparent'
  arrow.style.borderTop = '8px solid rgba(0, 0, 0, 0.9)'
  tooltip.appendChild(arrow)

  // Create content
  const content = document.createElement('div')
  content.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${marker.title}</div>
    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); margin-bottom: 8px;">${marker.locationLabel}</div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
      <span style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Score: ${marker.score}</span>
      <span style="background: rgba(34, 197, 94, 0.2); color: #4ADE80; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${marker.experienceYears}y exp</span>
    </div>
    ${marker.hourlyRate ? `<div style="font-size: 12px; color: rgba(255, 255, 255, 0.9);">$${marker.hourlyRate}/hr</div>` : ''}
    ${marker.topSkills.length > 0 ? `<div style="font-size: 11px; color: rgba(255, 255, 255, 0.7); margin-top: 6px;">Skills: ${marker.topSkills.join(', ')}</div>` : ''}
  `
  tooltip.appendChild(content)

  return tooltip
}

const createMarkerElement = (marker: TalentMarker) => {
  const { organization, score, availability, hourlyRate } = marker

  // Create main wrapper
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.alignItems = 'center'
  wrapper.style.cursor = 'pointer'
  wrapper.style.transform = 'translate(-50%, -100%)'
  wrapper.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
  wrapper.style.zIndex = '1'

  // Create tooltip
  const tooltip = createTooltipElement(marker)
  wrapper.appendChild(tooltip)

  // Create pin container with enhanced design
  const pinContainer = document.createElement('div')
  pinContainer.style.position = 'relative'
  pinContainer.style.width = '48px'
  pinContainer.style.height = '48px'
  pinContainer.style.borderRadius = '24px 24px 24px 4px'
  pinContainer.style.display = 'flex'
  pinContainer.style.alignItems = 'center'
  pinContainer.style.justifyContent = 'center'
  pinContainer.style.boxShadow =
    '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(255, 255, 255, 0.8)'
  pinContainer.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'

  // Set colors based on availability
  let bgColor = '#3B82F6' // default blue
  let borderColor = '#1E40AF'

  switch (availability) {
    case 'available':
      bgColor = '#10B981' // green
      borderColor = '#047857'
      break
    case 'busy':
      bgColor = '#F59E0B' // amber
      borderColor = '#D97706'
      break
    case 'unavailable':
      bgColor = '#EF4444' // red
      borderColor = '#DC2626'
      break
  }

  pinContainer.style.background = `linear-gradient(135deg, ${bgColor} 0%, ${borderColor} 100%)`

  // Create inner content area
  const innerContent = document.createElement('div')
  innerContent.style.width = '100%'
  innerContent.style.height = '100%'
  innerContent.style.borderRadius = 'inherit'
  innerContent.style.display = 'flex'
  innerContent.style.flexDirection = 'column'
  innerContent.style.alignItems = 'center'
  innerContent.style.justifyContent = 'center'
  innerContent.style.position = 'relative'

  // Add score badge at top
  const scoreBadge = document.createElement('div')
  scoreBadge.style.position = 'absolute'
  scoreBadge.style.top = '-8px'
  scoreBadge.style.right = '-8px'
  scoreBadge.style.width = '20px'
  scoreBadge.style.height = '20px'
  scoreBadge.style.borderRadius = '10px'
  scoreBadge.style.background = '#1F2937'
  scoreBadge.style.color = '#FFFFFF'
  scoreBadge.style.fontSize = '10px'
  scoreBadge.style.fontWeight = '700'
  scoreBadge.style.display = 'flex'
  scoreBadge.style.alignItems = 'center'
  scoreBadge.style.justifyContent = 'center'
  scoreBadge.style.border = '2px solid #FFFFFF'
  scoreBadge.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
  scoreBadge.textContent = score.toString()

  // Create SVG icon
  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  iconSvg.setAttribute('width', '22')
  iconSvg.setAttribute('height', '22')
  iconSvg.setAttribute('viewBox', '0 0 24 24')
  iconSvg.setAttribute('fill', 'none')
  iconSvg.setAttribute('stroke', '#FFFFFF')
  iconSvg.setAttribute('stroke-width', '2.5')
  iconSvg.setAttribute('stroke-linecap', 'round')
  iconSvg.setAttribute('stroke-linejoin', 'round')
  iconSvg.style.filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'

  // Choose icon based on organization type
  if (organization === 'Organization') {
    iconSvg.innerHTML = `
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/>
      <path d="M18 9v3"/>
      <path d="M13 9v3"/>
      <path d="M9 9v3"/>
      <path d="M9 18h6"/>
    `
  } else {
    iconSvg.innerHTML = `
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    `
  }

  // Add hourly rate if available
  if (hourlyRate) {
    const rateBadge = document.createElement('div')
    rateBadge.style.position = 'absolute'
    rateBadge.style.bottom = '-8px'
    rateBadge.style.left = '50%'
    rateBadge.style.transform = 'translateX(-50%)'
    rateBadge.style.background = '#FFFFFF'
    rateBadge.style.color = borderColor
    rateBadge.style.fontSize = '9px'
    rateBadge.style.fontWeight = '600'
    rateBadge.style.padding = '2px 6px'
    rateBadge.style.borderRadius = '8px'
    rateBadge.style.border = `1px solid ${borderColor}`
    rateBadge.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
    rateBadge.style.whiteSpace = 'nowrap'
    rateBadge.textContent = `$${hourlyRate}/hr`
    wrapper.appendChild(rateBadge)
  }

  // Assemble the pin
  innerContent.appendChild(iconSvg)
  pinContainer.appendChild(innerContent)
  pinContainer.appendChild(scoreBadge)
  wrapper.appendChild(pinContainer)

  // Add hover effects with tooltip
  wrapper.addEventListener('mouseenter', () => {
    pinContainer.style.transform = 'scale(1.1)'
    pinContainer.style.boxShadow =
      '0 8px 30px rgba(0, 0, 0, 0.25), 0 0 0 3px rgba(255, 255, 255, 0.9)'
    wrapper.style.zIndex = '10'

    // Show tooltip
    tooltip.style.opacity = '1'
    tooltip.style.visibility = 'visible'
    tooltip.style.transform = 'translateX(-50%) translateY(-8px)'
  })

  wrapper.addEventListener('mouseleave', () => {
    pinContainer.style.transform = 'scale(1)'
    pinContainer.style.boxShadow =
      '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(255, 255, 255, 0.8)'
    wrapper.style.zIndex = '1'

    // Hide tooltip
    tooltip.style.opacity = '0'
    tooltip.style.visibility = 'hidden'
    tooltip.style.transform = 'translateX(-50%) translateY(0)'
  })

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
      for (const { instance } of markersRef.current.values()) {
        instance.remove()
      }
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

    for (const [id, entry] of markersRef.current.entries()) {
      if (!nextIds.has(id)) {
        entry.instance.remove()
        markersRef.current.delete(id)
      }
    }

    for (const marker of markers) {
      const existing = markersRef.current.get(marker.id)

      if (!existing) {
        const element = createMarkerElement(marker)
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
    }
  }, [handleMarkerInteraction, isMapReady, markers, selectedMarkerId])

  return (
    <View flex={1} position="relative" rounded="$5" overflow="hidden">
      <div ref={containerRef} style={MAP_CONTAINER_STYLE} />
    </View>
  )
}

export default TalentMap
