import { Button } from '../buttons/Button'
import { Text } from 'tamagui'
import { View } from '@tamagui/core'
import { XStack, YStack } from '@tamagui/stacks'
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
      background="$color1"
      borderColor="$color6"
      borderWidth={1}
      py="$4"
      px="$3"
      height="auto"
      pressStyle={{
        background: '$color2',
        borderColor: '$color7',
      }}
      hoverStyle={{
        background: '$color2',
        borderColor: '$color7',
      }}
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderRadius: 16,
      }}
      disabled={!onPress}
    >
      <XStack style={{ alignItems: 'flex-start' }} gap="$3" flex={1}>
        {/* Status Indicator */}
        <View
          width={24}
          height={24}
          background={item.complete ? '$green9' : '$color6'}
          borderColor={item.complete ? '$green9' : '$color6'}
          borderWidth={1}
          mt="$1"
          style={{
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
            style={{ textAlign: 'left' }}
          >
            {item.title}
          </Text>
          <Text fontSize="$2" color="$color9" lineHeight="$1" style={{ textAlign: 'left' }}>
            {item.description}
          </Text>
        </YStack>
      </XStack>
    </Button>
  )
}
