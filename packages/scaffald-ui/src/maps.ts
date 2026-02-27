/**
 * Maps subpath export – tree-shakeable map UI components
 *
 * @example
 * import { MapContainer, MapPin } from '@scaffald/ui/maps'
 */

export { MapContainer, MapPin, MapTooltip, MapFallback } from './components/Maps'

export type {
  MapContainerProps,
  MapPinProps,
  MapTooltipProps,
  MapTooltipData,
  MapFallbackProps,
  MapCoordinate,
  ViewportBounds,
} from './components/Maps/Maps.types'
