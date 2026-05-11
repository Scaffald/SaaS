import { memo, useMemo } from 'react'
import type mapboxgl from 'mapbox-gl'
import { MapPin } from './MapPin'
import { MarkerPortal } from './MarkerPortal'
import { AVATAR_OFFSET_Y, isAvatarPin, type MapPinData } from './MapPin.shared'

interface MapMarkersProps {
  map: mapboxgl.Map | null
  pins: MapPinData[]
  jitteredCoords: Map<string, [number, number]>
  /**
   * IDs of pins to actually render. When undefined, all pins are rendered.
   * When set, only pins whose id is in this set get a marker — used to hide
   * pins that Mapbox has put into a cluster.
   */
  visiblePinIds?: ReadonlySet<string>
  theme: 'light' | 'dark'
  onPinPress?: (id: string) => void
  onPinHoverEnter?: (id: string) => void
  onPinHoverLeave?: (id: string) => void
}

export const MapMarkers = memo(function MapMarkers({
  map,
  pins,
  jitteredCoords,
  visiblePinIds,
  theme,
  onPinPress,
  onPinHoverEnter,
  onPinHoverLeave,
}: MapMarkersProps) {
  const visible = useMemo(
    () => (visiblePinIds ? pins.filter((p) => visiblePinIds.has(p.id)) : pins),
    [pins, visiblePinIds],
  )

  if (!map) return null

  return (
    <>
      {visible.map((pin) => {
        const coord = jitteredCoords.get(pin.id) ?? pin.coordinate
        const avatar = isAvatarPin(pin)
        return (
          <MarkerPortal
            key={pin.id}
            map={map}
            lngLat={coord}
            anchor={avatar ? 'bottom' : 'center'}
            offset={avatar ? [0, -AVATAR_OFFSET_Y] : undefined}
          >
            <MapPin
              pin={pin}
              theme={theme}
              onPress={onPinPress}
              onHoverEnter={onPinHoverEnter}
              onHoverLeave={onPinHoverLeave}
            />
          </MarkerPortal>
        )
      })}
    </>
  )
})
