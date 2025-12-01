import type { ViewStyle } from 'react-native'
import { Text, View, YStack } from 'tamagui'

interface MapFallbackProps {
  pinsCount: number
  message: string
  style?: ViewStyle
}

export function MapFallback({ pinsCount, message, style }: MapFallbackProps) {
  return (
    <View flex={1} items="center" justify="center" style={style}>
      <YStack bg="$backgroundHover" rounded="$4" p="$4" items="center" gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          📍
        </Text>
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Mapbox Maps
        </Text>
        <Text fontSize="$3" color="$color11" text="center">
          {message}
        </Text>
        <Text fontSize="$2" color="$color10" text="center">
          {pinsCount} pins ready to display
        </Text>
      </YStack>
    </View>
  )
}
