export type MapPinCategory = 'worker' | 'organization' | 'job'

export interface MapPin {
  id: string
  coordinate: [number, number] // [longitude, latitude]
  title: string
  subtitle?: string
  score?: number
  hourlyRate?: number
  availability?: 'available' | 'unavailable'
  organization?: 'Individual' | 'Organization' | 'Job'
  color?: string // Custom color for the pin (e.g., yellow for jobs)
  pinType?: MapPinCategory
  avatarUrl?: string | null
  badges?: Array<{
    id: string
    label: string
    tone: 'success' | 'warning' | 'danger'
  }>
  selected?: boolean
  data?: any
}

export interface MapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export interface ViewportBounds {
  north: number // Maximum latitude
  south: number // Minimum latitude
  east: number // Maximum longitude
  west: number // Minimum longitude
}

export interface MapTooltipData {
  title: string
  location?: string
  score?: number
  experienceYears?: number
  hourlyRate?: number
  skills?: string[]
  badges?: Array<{
    label: string
    tone: 'success' | 'warning' | 'danger'
  }>
}

export interface ClusterInfo {
  clusterId: number
  coordinates: [number, number]
  pointCount: number
  memberPinIds: string[]
}

export interface MapContainerProps {
  pins: MapPin[]
  center?: [number, number]
  zoom?: number
  radiusMeters?: number
  radius?: number // Radius in miles for circle visualization
  centerLocation?: [number, number] // [longitude, latitude] for search origin marker
  selectedPinId?: string | null
  onPinPress?: (pinId: string | null) => void
  onPinHover?: (pinId: string | null) => void
  onViewportChange?: (bounds: ViewportBounds, zoom: number) => void
  onMapReady?: (payload: { bounds: ViewportBounds; zoom: number }) => void
  onClustersChange?: (clusters: ClusterInfo[]) => void
  pinStates?: Map<string, { visibility: string; opacity: number }>
  showControls?: boolean
  style?: object
}

export interface MapContainerRef {
  flyTo: (center: [number, number], zoom?: number) => void
  centerOnPin: (pinId: string, options?: { preserveZoom?: boolean }) => void
  getPinScreenCoordinates: (pinId: string) => { x: number; y: number } | null
  setCardOverlay: (pinId: string | null, content: HTMLElement | null) => void
  getContainerRect: () => DOMRect | null
}
