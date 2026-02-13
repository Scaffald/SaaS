/**
 * MapTooltip – popover content for a map pin (title, location, optional extras).
 */

import { memo } from 'react'
import { Text, View } from 'react-native'
import type { MapTooltipProps } from './Maps.types'

function MapTooltipComponent({ data, visible, position, style }: MapTooltipProps) {
  if (!visible) return null

  const left = position?.x ?? 0
  const top = position?.y ?? 0

  return (
    <View
      style={[
        {
          position: 'absolute',
          minWidth: 200,
          maxWidth: 280,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 8,
          padding: 12,
          zIndex: 1000,
          left,
          top,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
        {data.title}
      </Text>
      {data.location != null && data.location !== '' && (
        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          📍 {data.location}
        </Text>
      )}
      {(data.score != null || data.experienceYears != null || data.hourlyRate != null) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {data.score != null && (
            <Text style={{ fontSize: 11, color: '#6b7280' }}>Score: {data.score}</Text>
          )}
          {data.experienceYears != null && (
            <Text style={{ fontSize: 11, color: '#6b7280' }}>
              Experience: {data.experienceYears}y
            </Text>
          )}
          {data.hourlyRate != null && (
            <Text style={{ fontSize: 11, color: '#6b7280' }}>${data.hourlyRate}/hr</Text>
          )}
        </View>
      )}
      {data.extras != null &&
        Object.entries(data.extras).map(([k, v]) => (
          <Text key={k} style={{ fontSize: 11, color: '#6b7280' }}>
            {k}: {String(v)}
          </Text>
        ))}
    </View>
  )
}

export const MapTooltip = memo(MapTooltipComponent)
MapTooltip.displayName = 'MapTooltip'
