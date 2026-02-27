/**
 * Maps module types – provider-agnostic (no Mapbox/Google dependency).
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

/** Coordinate [lng, lat] */
export type MapCoordinate = [number, number]

/** Bounds for viewport */
export interface ViewportBounds {
  north: number
  south: number
  east: number
  west: number
}

/** Ref type for map containers that support pin centering (e.g. Mapbox integration) */
export interface MapContainerRef {
  centerOnPin?: (id: string, opts?: { preserveZoom?: boolean }) => void
  getPinScreenCoordinates?: (id: string) => { x: number; y: number } | undefined
  getContainerRect?: () => DOMRect | undefined
}

/** MapContainer: wrapper for map content; actual map is provided by app or adapter */
export interface MapContainerProps {
  children?: ReactNode
  style?: ViewStyle
  /** Minimum height so layout doesn't collapse when map not loaded */
  minHeight?: number
  /** Extended props for map adapters (pins, center, zoom, etc.) - used by app-level Mapbox/Leaflet implementations */
  pins?: unknown[]
  center?: [number, number]
  zoom?: number
  radius?: number
  centerLocation?: [number, number]
  onPinPress?: (id: string) => void
  onViewportChange?: (bounds: ViewportBounds) => void
  onMapReady?: (args: { bounds: ViewportBounds; zoom: number }) => void
  onClustersChange?: (clusters: unknown[]) => void
  pinStates?: Map<string, unknown>
}

/** Simple pin for list/card or overlay; actual placement is adapter's responsibility */
export interface MapPinProps {
  /** Unique id */
  id: string
  /** [longitude, latitude] */
  coordinate?: MapCoordinate
  title?: string
  subtitle?: string
  /** Visual state */
  selected?: boolean
  /** Pin color (e.g. #3b82f6) */
  color?: string
  onPress?: (id: string) => void
  /** Accessibility label */
  accessibilityLabel?: string
}

/** Data for MapTooltip content */
export interface MapTooltipData {
  title: string
  location?: string
  score?: number
  experienceYears?: number
  hourlyRate?: number
  skills?: string[]
  /** Optional extra key-value rows */
  extras?: Record<string, string | number>
}

/** MapTooltip: popover shown on hover/select */
export interface MapTooltipProps {
  data: MapTooltipData
  visible: boolean
  position?: { x: number; y: number }
  style?: ViewStyle
}

/** MapFallback: shown when map fails or is unavailable */
export interface MapFallbackProps {
  message: string
  /** Optional count of pins that would be shown */
  pinsCount?: number
  style?: ViewStyle
}
