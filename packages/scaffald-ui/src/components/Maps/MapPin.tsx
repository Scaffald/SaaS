/**
 * MapPin – simple pin marker (circle + tail). Use in overlays or lists;
 * placement on the map is the responsibility of the map adapter.
 */

import { memo } from 'react'
import { Pressable, View } from 'react-native'
import type { MapPinProps } from './Maps.types'

const PIN_SIZE = 40
const TAIL_HEIGHT = 8
const DEFAULT_COLOR = '#3b82f6'

function MapPinComponent({
  id,
  title,
  selected = false,
  color = DEFAULT_COLOR,
  onPress,
  accessibilityLabel,
}: MapPinProps) {
  const content = (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: PIN_SIZE,
          height: PIN_SIZE,
          borderRadius: PIN_SIZE / 2,
          backgroundColor: color,
          borderWidth: selected ? 3 : 2,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          marginTop: -TAIL_HEIGHT,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: TAIL_HEIGHT,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        }}
      />
    </View>
  )

  const label = accessibilityLabel ?? title ?? `Pin ${id}`

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(id)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        {content}
      </Pressable>
    )
  }

  return <View accessibilityRole="image" accessibilityLabel={label}>{content}</View>
}

export const MapPin = memo(MapPinComponent)
MapPin.displayName = 'MapPin'
