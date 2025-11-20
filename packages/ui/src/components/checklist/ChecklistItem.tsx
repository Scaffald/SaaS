import { Button, Text, View, XStack, YStack } from 'tamagui'
import type { ChecklistItemProps } from './types'

/**
 * ChecklistItem - Individual checklist item component
 *
 * @param item - Checklist item data
 * @param onPress - Press handler
 * @returns JSX element
 */
export const ChecklistItem = ({ item, onPress }: ChecklistItemProps) => {
  return (
    <Button
      onPress={onPress}
      bg="$color1"
      borderColor="$color6"
      borderWidth={1}
      rounded="$4"
      py="$4"
      px="$3"
      height="auto"
      pressStyle={{
        bg: '$color2',
        borderColor: '$color7',
      }}
      hoverStyle={{
        bg: '$color2',
        borderColor: '$color7',
      }}
      justify="flex-start"
      items="flex-start"
      disabled={!onPress}
    >
      <XStack items="flex-start" gap="$3" flex={1}>
        {/* Status Indicator */}
        <View
          width={24}
          height={24}
          bg={item.complete ? '$green9' : '$color6'}
          borderColor={item.complete ? '$green9' : '$color6'}
          borderWidth={1}
          rounded="$10"
          items="center"
          justify="center"
          mt="$1"
        >
          {item.complete && (
            <Text fontSize="$1" color="white" fontWeight="bold">
              ✓
            </Text>
          )}
        </View>

        {/* Content */}
        <YStack flex={1} gap="$2">
          <Text
            fontSize="$4"
            fontWeight="500"
            color={item.complete ? '$color10' : '$color12'}
            text="left"
          >
            {item.title}
          </Text>
          <Text fontSize="$2" color="$color9" lineHeight="$1" text="left">
            {item.description}
          </Text>
        </YStack>
      </XStack>
    </Button>
  )
}
