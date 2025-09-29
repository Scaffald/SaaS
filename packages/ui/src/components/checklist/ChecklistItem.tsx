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
      padding="$3"
      pressStyle={{
        backgroundColor: '$gray2',
        borderColor: '$gray7',
      }}
      hoverStyle={{
        backgroundColor: '$gray2',
        borderColor: '$gray7',
      }}
      justifyContent="space-between"
      alignItems="center"
      disabled={!onPress}
    >
      <XStack alignItems="center" gap="$3" flex={1}>
        {/* Status Indicator */}
        <View
          width={24}
          height={24}
          backgroundColor={item.complete ? '$blue9' : '$gray6'}
          borderColor={item.complete ? '$blue9' : '$gray6'}
          borderWidth={1}
          borderRadius="$10"
          alignItems="center"
          justifyContent="center"
        >
          {item.complete && (
            <Text fontSize="$1" color="white" fontWeight="bold">
              ✓
            </Text>
          )}
        </View>

        {/* Content */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="500" color={item.complete ? '$gray10' : '$gray12'}>
            {item.title}
          </Text>
          <Text fontSize="$2" color="$gray9" lineHeight="$1">
            {item.description}
          </Text>
        </YStack>
      </XStack>

      {/* Action Arrow */}
      <View
        width={24}
        height={24}
        backgroundColor={item.complete ? '$gray6' : '$blue9'}
        borderColor={item.complete ? '$gray6' : '$blue9'}
        borderWidth={1}
        borderRadius="$10"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="$2" color={item.complete ? '$gray9' : 'white'} fontWeight="bold">
          ›
        </Text>
      </View>
    </Button>
  )
}
