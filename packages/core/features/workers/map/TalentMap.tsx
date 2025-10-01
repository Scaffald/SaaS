import { useMemo } from 'react'
import { MapComponent, type MapMarkerData } from '@app/ui'
import type { TalentMapProps } from './types'

export const TalentMap = ({
  center,
  markers,
  radiusMeters,
  selectedMarkerId,
  onMarkerPress,
}: TalentMapProps) => {
  // Convert TalentMarker format to MapMarkerData format
  const mapMarkers: MapMarkerData[] = useMemo(
    () =>
      markers.map((marker) => ({
        id: marker.id,
        coordinate: marker.coordinate,
        score: marker.score,
        hourlyRate: marker.hourlyRate,
        availability: marker.availability,
        organization: marker.organization,
      })),
    [markers]
  )

  return (
    <MapComponent
      center={center}
      markers={mapMarkers}
      radiusMeters={radiusMeters}
      selectedMarkerId={selectedMarkerId}
      onMarkerPress={onMarkerPress}
    />
  )
}

export default TalentMap
