export interface MapPin {
  id: string
  coordinate: [number, number] // [longitude, latitude]
  title: string
  subtitle?: string
  score?: number
  hourlyRate?: number
  availability?: 'available' | 'unavailable'
  organization?: 'Individual' | 'Organization' | 'Job'
  type?: 'worker' | 'organization' | 'job'
  color?: string // Custom color for the pin (e.g., yellow for jobs)
  badges?: Array<{
    id: string
    label: string
    tone: 'success' | 'warning' | 'danger'
  }>
  selected?: boolean
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

export interface MapContainerProps {
  pins: MapPin[]
  center?: [number, number]
  zoom?: number
  radiusMeters?: number
  selectedPinId?: string | null
  onPinPress?: (pinId: string | null) => void
  onViewportChange?: (bounds: ViewportBounds, zoom: number) => void
  onMapReady?: (payload: { bounds: ViewportBounds; zoom: number }) => void
  showControls?: boolean
  style?: object
}

export interface MapContainerRef {
  flyTo: (center: [number, number], zoom?: number) => void
  centerOnPin: (pinId: string) => void
  getPinScreenCoordinates: (pinId: string) => { x: number; y: number } | null
  setCardOverlay: (pinId: string | null, content: HTMLElement | null) => void
}
