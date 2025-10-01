export interface MapPin {
  id: string
  coordinate: [number, number] // [longitude, latitude]
  title: string
  subtitle?: string
  score?: number
  hourlyRate?: number
  availability?: 'available' | 'unavailable'
  organization?: 'Individual' | 'Organization'
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
  onPinPress?: (pinId: string) => void
  showControls?: boolean
  style?: object
}
