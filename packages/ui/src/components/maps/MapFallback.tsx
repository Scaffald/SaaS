import type { ViewStyle } from 'react-native'
import { Text } from 'tamagui'
import { View } from '@tamagui/core'
import { YStack } from '@tamagui/stacks'

interface MapFallbackProps {
  pinsCount: number
  message: string
  style?: ViewStyle
}

export function MapFallback({ pinsCount, message, style }: MapFallbackProps) {
  return (
    <View flex={1} alignItems="center" justifyContent="center" style={style}>
      <YStack
        background="$backgroundHover"
        br="$4"
        p="$4"
        style={{ alignItems: 'center' }}
        gap="$2"
      >
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          📍
        </Text>
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Mapbox Maps
        </Text>
        <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
          {message}
        </Text>
        <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
          {pinsCount} pins ready to display
        </Text>
      </YStack>
    </View>
  )
}
