import { memo } from 'react'
import { View, Text, YStack, Circle } from 'tamagui'
import { User, Building } from '@tamagui/lucide-icons'
import type { MapPin as MapPinType } from './types'

interface MapPinProps {
  pin: MapPinType
  onPress?: (pinId: string) => void
}

export const MapPin = memo(({ pin, onPress }: MapPinProps) => {
  const { id, score, hourlyRate, availability = 'available', organization, selected } = pin

  // Get background color based on availability
  const getBackgroundColor = () => {
    switch (availability) {
      case 'available':
        return '$green9'
      case 'busy':
        return '$orange9'
      case 'unavailable':
        return '$red9'
      default:
        return '$blue9'
    }
  }

  const backgroundColor = getBackgroundColor()

  const handlePress = () => {
    onPress?.(id)
  }

  return (
    <YStack items="center" onPress={handlePress} pressStyle={{ scale: 0.95 }}>
      {/* Main Pin Body */}
      <View
        width={48}
        height={48}
        rounded="$12"
        bg={backgroundColor}
        borderWidth={selected ? 3 : 2}
        borderColor={selected ? '$color12' : '$color1'}
        position="relative"
        items="center"
        justify="center"
      >
        {/* Icon based on organization type */}
        {organization === 'Organization' ? (
          <Building size={22} color="white" />
        ) : (
          <User size={22} color="white" />
        )}

        {/* Score Badge */}
        {score && (
          <Circle
            size={20}
            bg="$color12"
            position="absolute"
            t={-8}
            r={-8}
            items="center"
            justify="center"
            borderWidth={2}
            borderColor="$color1"
          >
            <Text color="white" fontSize={10} fontWeight="700">
              {score}
            </Text>
          </Circle>
        )}

        {/* Hourly Rate Badge */}
        {hourlyRate && (
          <View
            position="absolute"
            b={-8}
            bg="white"
            rounded="$2"
            px={6}
            py={2}
            borderWidth={1}
            borderColor={'$color12'}
          >
            <Text color={'$color12'} fontSize={9} fontWeight="600">
              ${hourlyRate}/hr
            </Text>
          </View>
        )}
      </View>

      {/* Pin Tail - Triangle pointing down */}
      <View
        width={0}
        height={0}
        borderLeftWidth={6}
        borderRightWidth={6}
        borderTopWidth={8}
        borderLeftColor="transparent"
        borderRightColor="transparent"
        borderTopColor={'$color12'}
        mt={-1}
      />

      {/* Selected Indicator */}
      {selected && <Circle size={12} bg="$blue10" mt={4} animation="quick" />}
    </YStack>
  )
})

MapPin.displayName = 'MapPin'
