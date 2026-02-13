import { Button } from '@scaffald/ui'
import type { MainColor } from 'luscher-test'
import { useEffect, useState } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
import { type Color, shuffleColors } from '../lib/luscher/utils'

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
  // Always shuffle colors randomly for display - reshuffle on every render/mount
  const [colors, setColors] = useState<Color[]>(() => shuffleColors())
  const [selectedOrder, setSelectedOrder] = useState<number[]>(initialChoices || [])

  // Shuffle colors every time the component renders or step changes
  useEffect(() => {
    // Always shuffle colors fresh - randomize every time
    const shuffled = shuffleColors()
    if (initialChoices.length === 0) {
      // No previous choices - reset everything with fresh shuffle
      setColors(shuffled)
      setSelectedOrder([])
    } else {
      // Has previous choices - shuffle but mark selected ones
      setColors(
        shuffled.map((color) => ({
          ...color,
          selected: initialChoices.includes(color.value),
        }))
      )
      setSelectedOrder(initialChoices)
    }
  }, [initialChoices]) // Reshuffle when initialChoices change

  const handleColorPress = (colorValue: MainColor) => {
    if (selectedOrder.includes(colorValue)) {
      return // Already selected
    }

    const newOrder = [...selectedOrder, colorValue]
    setSelectedOrder(newOrder)

    // Update color selection state - selected colors fade to 0 opacity
    const updatedColors = colors.map((color) => ({
      ...color,
      selected: newOrder.includes(color.value),
    }))
    setColors(updatedColors)

    // Auto-save when 8 colors are selected with fade animation
    if (newOrder.length === 8) {
      // Small delay for fade animation before auto-advancing
      setTimeout(() => {
        onSave(newOrder)
      }, 300)
    }
  }

  const isComplete = selectedOrder.length === 8
  const remaining = 8 - selectedOrder.length

  return (
    <Stack gap={24} maxWidth={800} width="100%" marginHorizontal="auto">
      <Stack gap={8} align="center">
        <Text color="$gray11" textAlign="center">
          {step === 'luscher1' ? 'First Color Test' : 'Second Color Test'}
        </Text>
        <Text color="$gray11" textAlign="center">
          Click the colors in order based on what makes you feel the best.
        </Text>
        <Text color="$gray11" textAlign="center">
          {isComplete
            ? 'All 8 colors selected!'
            : `Select ${remaining} more color${remaining > 1 ? 's' : ''}`}
        </Text>
      </Stack>

      {/* Color Grid: 2x4 on mobile, 4x2 on desktop */}
      <Stack gap={12} width="100%">
        {/* Mobile: 2 columns, 4 rows */}
        <Row gap={12} flexWrap="wrap" justify="center" display="flex">
          {colors.map((color) => {
            const isSelected = selectedOrder.includes(color.value)

            return (
              <Stack
                key={String(color.key)}
                gap={8}
                align="center"
                cursor={isSelected ? 'default' : 'pointer'}
                opacity={isSelected ? 0 : 1}
                animation="quick"
                pressStyle={{ scale: 0.95 }}
                onPress={() => !isSelected && handleColorPress(color.value)}
                disabled={isSelected || isLoading}
                maxWidth={200}
                minWidth={120}
                pointerEvents={isSelected ? 'none' : 'auto'}
              >
                <Stack
                  width="100%"
                  aspectRatio={1}
                  maxWidth={200}
                  maxHeight={200}
                  style={{ backgroundColor: color.hex }}
                  borderRadius={16}
                  justify="center"
                  align="center"
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.1}
                  shadowRadius={4}
                />
              </Stack>
            )
          })}
        </Row>

        {/* Desktop: 4 columns, 2 rows */}
        <Row gap={12} flexWrap="wrap" justify="center" display="none">
          {colors.map((color) => {
            const isSelected = selectedOrder.includes(color.value)

            return (
              <Stack
                key={String(color.key)}
                gap={8}
                align="center"
                cursor={isSelected ? 'default' : 'pointer'}
                opacity={isSelected ? 0 : 1}
                animation="quick"
                pressStyle={{ scale: 0.95 }}
                onPress={() => !isSelected && handleColorPress(color.value)}
                disabled={isSelected || isLoading}
                maxWidth={250}
                minWidth={150}
                pointerEvents={isSelected ? 'none' : 'auto'}
              >
                <Stack
                  width="100%"
                  aspectRatio={1}
                  maxWidth={250}
                  maxHeight={250}
                  style={{ backgroundColor: color.hex }}
                  borderRadius={16}
                  justify="center"
                  align="center"
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.1}
                  shadowRadius={4}
                />
              </Stack>
            )
          })}
        </Row>
      </Stack>

      {/* Manual Save Button (if not auto-saved) */}
      {isComplete && !isLoading && (
        <Row justify="center">
          <Button variant="filled" color="primary" size="md" onPress={() => onSave(selectedOrder)}>
            Continue
          </Button>
        </Row>
      )}
    </Stack>
  )
}
