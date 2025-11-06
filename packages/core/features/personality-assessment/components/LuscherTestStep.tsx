import { useState, useEffect } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import type { MainColor } from 'luscher-test'
import { colorChoices, type Color } from '../lib/luscher/utils'

export interface LuscherTestStepProps {
  step: 'luscher1' | 'luscher2'
  initialChoices: number[]
  onSave: (choices: number[], results?: string) => void
  isLoading?: boolean
}

/**
 * LuscherTestStep - Color selection step for personality assessment
 * Displays 8 colors and allows user to select them in order
 */
export function LuscherTestStep({
  step,
  initialChoices,
  onSave,
  isLoading = false,
}: LuscherTestStepProps) {
  const [colors, setColors] = useState<Color[]>(() => {
    const choices = colorChoices()
    return step === 'luscher1' ? choices : choices.reverse()
  })
  const [selectedOrder, setSelectedOrder] = useState<number[]>(initialChoices || [])

  useEffect(() => {
    // Mark colors as selected based on initial choices
    if (initialChoices.length > 0) {
      const updatedColors = colors.map((color) => ({
        ...color,
        selected: initialChoices.includes(color.value),
      }))
      setColors(updatedColors)
      setSelectedOrder(initialChoices)
    }
  }, [initialChoices])

  const handleColorPress = (colorValue: MainColor) => {
    if (selectedOrder.includes(colorValue)) {
      return // Already selected
    }

    const newOrder = [...selectedOrder, colorValue]
    setSelectedOrder(newOrder)

    // Update color selection state
    const updatedColors = colors.map((color) => ({
      ...color,
      selected: newOrder.includes(color.value),
    }))
    setColors(updatedColors)

    // Auto-save when 8 colors are selected
    if (newOrder.length === 8) {
      // For luscher2, we'll generate results on the server side
      // Just pass the choices for now
      onSave(newOrder)
    }
  }

  const isComplete = selectedOrder.length === 8
  const remaining = 8 - selectedOrder.length

  return (
    <YStack gap="$6" maxW={800} width="100%" mx="auto">
      <YStack gap="$2" items="center">
        <Text fontSize="$6" fontWeight="600" color="$color12" text="center">
          {step === 'luscher1' ? 'First Color Test' : 'Second Color Test (Aspirational)'}
        </Text>
        <Text fontSize="$4" color="$color11" text="center">
          Click the colors in order based on what makes you feel the best.
        </Text>
        <Text fontSize="$3" color="$color10" text="center">
          {isComplete
            ? 'All 8 colors selected!'
            : `Select ${remaining} more color${remaining > 1 ? 's' : ''}`}
        </Text>
      </YStack>

      {/* Color Grid */}
      <XStack gap="$3" flexWrap="wrap" justify="center">
        {colors.map((color) => {
          const isSelected = selectedOrder.includes(color.value)

          return (
            <YStack
              key={String(color.key)}
              gap="$2"
              items="center"
              cursor={isSelected ? 'default' : 'pointer'}
              opacity={isSelected ? 0 : 1}
              pressStyle={{ scale: 0.95 }}
              onPress={() => !isSelected && handleColorPress(color.value)}
              disabled={isSelected || isLoading}
              // Responsive width: 2 columns on mobile (xs), 4 columns on desktop (gtXs)
              flexBasis="48%"
              $gtXs={{ flexBasis: '23%' }}
              maxW={250}
              $xs={{ maxW: 200 }}
              minW={120}
              pointerEvents={isSelected ? 'none' : 'auto'}
            >
              <YStack
                width="100%"
                aspectRatio={1}
                maxW={250}
                maxH={250}
                $xs={{ maxW: 200, maxH: 200 }}
                bg={color.hex}
                rounded="$4"
                borderWidth={2}
                borderColor="$color7"
                justify="center"
                items="center"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.1}
                shadowRadius={4}
              />
            </YStack>
          )
        })}
      </XStack>

      {/* Manual Save Button (if not auto-saved) */}
      {isComplete && !isLoading && (
        <XStack justify="center">
          <Button size="$4" onPress={() => onSave(selectedOrder)}>
            Continue
          </Button>
        </XStack>
      )}
    </YStack>
  )
}
