import React from 'react'
import { Button, XStack, YStack, Text, View } from 'tamagui'
import type { ChecklistItem as ChecklistItemType, ChecklistItemProps } from './types'

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
      backgroundColor="$color1"
      borderColor="$gray6"
      borderWidth={1}
      borderRadius="$4"
      paddingVertical="$4"
      paddingHorizontal="$3"
      height="auto"
      pressStyle={{
        backgroundColor: '$gray2',
        borderColor: '$gray7',
      }}
      hoverStyle={{
        backgroundColor: '$gray2',
        borderColor: '$gray7',
      }}
      justifyContent="flex-start"
      alignItems="flex-start"
      disabled={!onPress}
    >
      <XStack alignItems="flex-start" gap="$3" flex={1}>
        {/* Status Indicator */}
        <View
          width={24}
          height={24}
          backgroundColor={item.complete ? '$green9' : '$gray6'}
          borderColor={item.complete ? '$green9' : '$gray6'}
          borderWidth={1}
          borderRadius="$10"
          alignItems="center"
          justifyContent="center"
          marginTop="$1"
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
            color={item.complete ? '$gray10' : '$gray12'}
            textAlign="left"
          >
            {item.title}
          </Text>
          <Text fontSize="$2" color="$gray9" lineHeight="$1" textAlign="left">
            {item.description}
          </Text>
        </YStack>
      </XStack>
    </Button>
  )
}
