import { useState } from 'react'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import { ChevronDown, ChevronUp, ThumbsUp, AlertCircle } from '@tamagui/lucide-icons'
import type { OnetElement, OnetElementRating } from '../data/mock-onet-elements'
import { StarRating } from './StarRating'

interface OnetElementRatingProps {
  element: OnetElement
  rating?: OnetElementRating
  onRate: (rating: OnetElementRating) => void
  showDescription?: boolean
}

export function OnetElementRatingComponent({
  element,
  rating,
  onRate,
  showDescription = false,
}: OnetElementRatingProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedRating, setSelectedRating] = useState(rating?.rating || 0)
  const [isStrength, setIsStrength] = useState(rating?.isStrength)

  const handleRatingChange = (newRating: number) => {
    setSelectedRating(newRating)

    // Auto-select as strength if rating is 4 or 5
    const autoIsStrength = newRating >= 4
    if (isStrength === undefined && newRating >= 4) {
      setIsStrength(autoIsStrength)
    }

    onRate({
      elementId: element.id,
      elementType: element.type,
      rating: newRating,
      isStrength: isStrength ?? autoIsStrength,
    })
  }

  const handleStrengthToggle = (strengthValue: boolean) => {
    setIsStrength(strengthValue)
    onRate({
      elementId: element.id,
      elementType: element.type,
      rating: selectedRating,
      isStrength: strengthValue,
    })
  }

  const getElementTypeLabel = (type: OnetElement['type']) => {
    switch (type) {
      case 'skill':
        return 'Skill'
      case 'ability':
        return 'Ability'
      case 'work_value':
        return 'Work Value'
      case 'work_activity':
        return 'Work Activity'
    }
  }

  return (
    <YStack
      bg="$background"
      borderWidth={1}
      borderColor={selectedRating > 0 ? '$blue6' : '$borderColor'}
      br="$4"
      p="$4"
      gap="$3"
    >
      {/* Element Name and Type */}
      <XStack style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <YStack flex={1} gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color">
            {element.name}
          </Text>
          <Text fontSize="$2" color="$color10" textTransform="uppercase">
            {getElementTypeLabel(element.type)}
          </Text>
        </YStack>

        {/* Expand Description Button */}
        <Button
          size="$2"
          circular
          chromeless
          icon={expanded ? ChevronUp : ChevronDown}
          onPress={() => setExpanded(!expanded)}
        />
      </XStack>

      {/* Description (Collapsible) */}
      {(expanded || showDescription) && (
        <Paragraph fontSize="$3" color="$color11" lineHeight="$3">
          {element.description}
        </Paragraph>
      )}

      {/* Star Rating */}
      <StarRating label="" value={selectedRating} onChange={handleRatingChange} />

      {/* Strength/Improvement Toggle (shown only when rated >= 3) */}
      {selectedRating >= 3 && (
        <YStack gap="$2">
          <Text fontSize="$3" color="$color11">
            Is this a:
          </Text>
          <XStack gap="$2">
            <Button
              flex={1}
              size="$3"
              theme={isStrength === true ? 'blue' : undefined}
              bg={isStrength === true ? '$blue9' : '$background'}
              borderColor={isStrength === true ? '$blue9' : '$borderColor'}
              onPress={() => handleStrengthToggle(true)}
              icon={ThumbsUp}
            >
              <Text
                color={isStrength === true ? 'white' : '$color'}
                fontWeight={isStrength === true ? '600' : 'normal'}
              >
                Strength
              </Text>
            </Button>
            <Button
              flex={1}
              size="$3"
              theme={isStrength === false ? 'orange' : undefined}
              bg={isStrength === false ? '$orange9' : '$background'}
              borderColor={isStrength === false ? '$orange9' : '$borderColor'}
              onPress={() => handleStrengthToggle(false)}
              icon={AlertCircle}
            >
              <Text
                color={isStrength === false ? 'white' : '$color'}
                fontWeight={isStrength === false ? '600' : 'normal'}
              >
                Area to Improve
              </Text>
            </Button>
          </XStack>
        </YStack>
      )}
    </YStack>
  )
}
