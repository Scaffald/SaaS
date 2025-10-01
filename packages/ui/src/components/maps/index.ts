export { MapContainer } from './MapContainer'
export { MapPin } from './MapPin'
export { MapTooltip } from './MapTooltip'
export { mockMapPins, defaultMapCenter, defaultMapZoom, defaultRadius } from './mockData'
export type { MapPin as MapPinType, MapContainerProps, MapTooltipData, MapRegion } from './types'

// Web-specific MapBox components are NOT exported here to avoid breaking React Native
// They should be imported directly: import { MapComponent, MapMarker } from '@app/ui/src/components/maps/Map.web'
