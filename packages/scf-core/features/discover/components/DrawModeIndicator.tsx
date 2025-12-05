import { Text, YStack } from '@unicornlove/ui'

interface DrawModeIndicatorProps {
  isActive: boolean
}

export function DrawModeIndicator({ isActive }: DrawModeIndicatorProps) {
  if (!isActive) return null

  return (
    <YStack
      position="absolute"
      top="$4"
      left="$4"
      right="$4"
      zIndex={100}
      backgroundColor="$blue9"
      padding="$3"
      borderRadius="$4"
      alignItems="center"
    >
      <Text color="white" fontSize="$4" fontWeight="600">
        🖊️ Draw Mode Active - Draw on the map to select an area
      </Text>
    </YStack>
  )
}
