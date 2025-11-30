import { Building, User } from '@tamagui/lucide-icons'
import { memo } from 'react'
import { Circle, type GetThemeValueForKey, useTheme, View, YStack } from 'tamagui'
import type { MapPin as MapPinType } from './types'

interface MapPinProps {
  pin: MapPinType
  onPress?: (pinId: string) => void
}

export const MapPin = memo(({ pin, onPress }: MapPinProps) => {
  const { id, availability = 'available', organization, selected } = pin
  const theme = useTheme()

  // Get background color based on organization type and availability
  const getBackgroundColor = (): GetThemeValueForKey<'backgroundColor'> => {
    // Organizations get purple/violet color
    if (organization === 'Organization') {
      return theme.purple9?.val as GetThemeValueForKey<'backgroundColor'>
    }

    // Workers get color based on availability
    switch (availability) {
      case 'available':
        return theme.color9?.val as GetThemeValueForKey<'backgroundColor'>
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
      {organization === 'Organization' ? (
        /* Organization Pin - Diamond Shape */
        <>
          <View
            width={48}
            height={48}
            bg={backgroundColor}
            borderWidth={selected ? 3 : 2}
            borderColor={selected ? '$color12' : '$color1'}
            position="relative"
            items="center"
            justify="center"
            transform={[{ rotate: '45deg' }]}
          >
            <View transform={[{ rotate: '-45deg' }]} items="center" justify="center">
              <Building size={22} color="white" />
            </View>
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
            borderTopColor={backgroundColor}
            mt={-8}
          />

          {/* Selected Indicator */}
          {selected && <Circle size={12} bg="$blue10" mt={4} animation="quick" />}
        </>
      ) : (
        /* Worker Pin - Circle Shape */
        <>
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
            <User size={22} color="white" />
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
        </>
      )}
    </YStack>
  )
})

MapPin.displayName = 'MapPin'
