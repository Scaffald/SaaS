import { useMemo } from 'react'
import { Button } from '@scaffald/ui'
import type { MainColor } from 'luscher-test'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { AssessmentHeader, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()

  const [colorList, setColorList] = useState<Color[]>(() => shuffleColors())
  const [selectedOrder, setSelectedOrder] = useState<number[]>(initialChoices || [])

  useEffect(() => {
    const shuffled = shuffleColors()
    if (initialChoices.length === 0) {
      setColorList(shuffled)
      setSelectedOrder([])
    } else {
      setColorList(
        shuffled.map((color) => ({
          ...color,
          selected: initialChoices.includes(color.value),
        }))
      )
      setSelectedOrder(initialChoices)
    }
  }, [initialChoices])

  const handleColorPress = (colorValue: MainColor) => {
    if (selectedOrder.includes(colorValue)) {
      return
    }

    const newOrder = [...selectedOrder, colorValue]
    setSelectedOrder(newOrder)

    const updatedColors = colorList.map((color) => ({
      ...color,
      selected: newOrder.includes(color.value),
    }))
    setColorList(updatedColors)

    if (newOrder.length === 8) {
      setTimeout(() => {
        onSave(newOrder)
      }, 400)
    }
  }

  const isComplete = selectedOrder.length === 8

  const chipLabel = isComplete ? 'All 8 selected' : `${selectedOrder.length} of 8`

  const shadowStyle = useMemo(
    () => ({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.12,
      shadowRadius: 6,
    }),
    [theme]
  )

  return (
    <Stack gap={24} maxWidth={800} width="100%" style={{ marginHorizontal: 'auto' }}>
      <Stack gap={12} align="center">
        <AssessmentHeader
          category={step === 'luscher1' ? 'Round 1' : 'Round 2'}
          title={step === 'luscher1' ? 'First Color Selection' : 'Second Color Selection'}
          subtitle="Click the colors in order based on what feels best to you right now."
          align="center"
        />
        <Stack
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: isComplete ? colors.primary[500] : colors.bg[theme].subtle,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: isComplete ? '#fff' : colors.text[theme].secondary,
            }}
          >
            {chipLabel}
          </Text>
        </Stack>
      </Stack>

      {/* Color Grid */}
      <Row gap={12} wrap justify="center">
        {colorList.map((color) => {
          const isSelected = selectedOrder.includes(color.value)

          return (
            <Pressable
              key={String(color.key)}
              disabled={isSelected || isLoading}
              onPress={() => !isSelected && handleColorPress(color.value)}
              style={{
                opacity: isSelected ? 0 : 1,
                transform: [{ scale: isSelected ? 0.6 : 1 }],
                maxWidth: 200,
                minWidth: 120,
              }}
            >
              <Stack
                width="100%"
                style={{
                  aspectRatio: 1,
                  backgroundColor: color.hex,
                  borderRadius: 16,
                  maxWidth: 200,
                  maxHeight: 200,
                  ...shadowStyle,
                }}
                justify="center"
                align="center"
              />
            </Pressable>
          )
        })}
      </Row>

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
