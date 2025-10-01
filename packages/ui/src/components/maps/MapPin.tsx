import { memo } from 'react'
import { View, Text, YStack, Circle, useTheme, GetThemeValueForKey } from 'tamagui'
import { User, Building } from '@tamagui/lucide-icons'
import type { MapPin as MapPinType } from './types'

interface MapPinProps {
  pin: MapPinType
  onPress?: (pinId: string) => void
}

export const MapPin = memo(({ pin, onPress }: MapPinProps) => {
  const { id, score, availability = 'available', organization, selected } = pin
  const theme = useTheme()

  // Get background color based on availability
  const getBackgroundColor = (): GetThemeValueForKey<'backgroundColor'> => {
    switch (availability) {
      case 'available':
        return theme.green9?.val as GetThemeValueForKey<'backgroundColor'>
      case 'unavailable':
        return theme.red9?.val as GetThemeValueForKey<'backgroundColor'>
      default:
        return theme.blue9?.val as GetThemeValueForKey<'backgroundColor'>
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
            borderWidth={1}
            borderColor="$color1"
          >
            <Text color="white" fontSize={10} fontWeight="700">
              {score}
            </Text>
          </Circle>
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
