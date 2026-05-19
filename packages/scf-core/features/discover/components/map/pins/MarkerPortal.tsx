import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'

interface MarkerPortalProps {
  map: mapboxgl.Map
  lngLat: [number, number]
  anchor?: mapboxgl.Anchor
  offset?: [number, number]
  children: React.ReactNode
}

export function MarkerPortal({
  map,
  lngLat,
  anchor = 'center',
  offset,
  children,
}: MarkerPortalProps) {
  const [el] = useState(() => {
    const div = document.createElement('div') // platform-allow: only imported by MapAdapter.web.tsx
    div.style.pointerEvents = 'auto'
    return div
  })
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    const marker = new mapboxgl.Marker({
      element: el,
      anchor,
      ...(offset ? { offset } : {}),
    })
      .setLngLat(lngLat)
      .addTo(map)
    markerRef.current = marker
    return () => {
      try { marker.remove() } catch { /* ignore */ }
      markerRef.current = null
    }
    // anchor changes are rare; we intentionally don't re-create on lngLat changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, anchor, el])

  useEffect(() => {
    markerRef.current?.setLngLat(lngLat)
  }, [lngLat[0], lngLat[1]])

  return createPortal(children, el)
}
