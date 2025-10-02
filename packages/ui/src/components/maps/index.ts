export { MapContainer } from "./MapContainer";
export { MapPin } from "./MapPin";
export { MapTooltip } from "./MapTooltip";
export {
  defaultMapCenter,
  defaultMapZoom,
  defaultRadius,
  mockMapPins,
} from "./mockData";
export type {
  MapContainerProps,
  MapPin as MapPinType,
  MapRegion,
  MapTooltipData,
} from "./types";
export type { MapContainerRef } from "./MapContainer";

// Web-specific MapBox components are NOT exported here to avoid breaking React Native
// They should be imported directly: import { MapComponent, MapMarker } from '@app/ui/src/components/maps/Map.web'
