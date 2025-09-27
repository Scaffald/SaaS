export type TalentMarker = {
  id: string
  coordinate: [number, number]
  title: string
  subtitle?: string
  metric?: string
  organization?: string
}

export type TalentMapProps = {
  center: [number, number]
  markers: TalentMarker[]
  radiusMeters?: number
  selectedMarkerId?: string | null
  onMarkerPress?: (markerId: string) => void
}
