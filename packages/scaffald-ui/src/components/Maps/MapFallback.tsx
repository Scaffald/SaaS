/**
 * MapFallback – shown when the map is unavailable or failed to load.
 */

import { Text, View } from 'react-native'
import type { MapFallbackProps } from './Maps.types'

export function MapFallback({ message, pinsCount, style }: MapFallbackProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: 8,
          padding: 24,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 24, marginBottom: 8 }}>📍</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
        Map
      </Text>
      <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>{message}</Text>
      {pinsCount != null && (
        <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
          {pinsCount} pin{pinsCount !== 1 ? 's' : ''} ready to display
        </Text>
      )}
    </View>
  )
}
