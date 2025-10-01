export type TalentMarker = {
  id: string
  coordinate: [number, number]
  title: string
  subtitle?: string
  metric?: string
  organization?: string
  // Enhanced fields for richer annotations
  profilePhoto?: string
  score: number
  hourlyRate?: number
  experienceYears: number
  topSkills: string[]
  badges: Array<{
    id: string
    label: string
    tone: 'success' | 'warning' | 'danger'
  }>
  availability: 'available' | 'busy' | 'unavailable'
  locationLabel: string
}

export type TalentMapProps = {
  center: [number, number]
  markers: TalentMarker[]
  radiusMeters?: number
  selectedMarkerId?: string | null
  onMarkerPress?: (markerId: string) => void
}
