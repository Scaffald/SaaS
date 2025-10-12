import { YStack, XStack, Text, Slider } from 'tamagui'
import { RIASEC_DIMENSIONS, type RiasecScores } from '../config/career-assessment-schema'

interface RiasecQuickAssessmentProps {
  value: RiasecScores
  onChange: (scores: RiasecScores) => void
  disabled?: boolean
}

/**
 * RiasecQuickAssessment Component
 *
 * Displays 6 interactive sliders for rating RIASEC interest dimensions (1-5 scale)
 * Used for quick career interest assessment
 *
 * @param value - Current RIASEC scores
 * @param onChange - Callback when scores change
 * @param disabled - Whether sliders are disabled
 */
export function RiasecQuickAssessment({
  value,
  onChange,
  disabled = false,
}: RiasecQuickAssessmentProps) {
  const handleSliderChange = (key: keyof RiasecScores, newValue: number[]) => {
    onChange({
      ...value,
      [key]: newValue[0],
    })
  }

  return (
    <YStack gap="$4" width="100%">
      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Rate Your Interests
        </Text>
        <Text fontSize="$2" color="$color11">
          Move the sliders to indicate how much you agree with each statement (1 = Disagree, 5 =
          Strongly Agree)
        </Text>
      </YStack>

      {RIASEC_DIMENSIONS.map((dimension) => (
        <YStack key={dimension.key} gap="$3">
          <XStack gap="$3" items="center">
            <YStack flex={1} gap="$1">
              <Text fontSize="$4" fontWeight="600">
                {dimension.label}
              </Text>
              <Text fontSize="$2" color="$color11">
                {dimension.description}
              </Text>
            </YStack>
            <XStack
              width={60}
              height={32}
              items="center"
              borderWidth={1}
              borderColor="$borderColor"
              px="$2"
            >
              <Text fontSize="$6" fontWeight="bold">
                {value[dimension.key]}
              </Text>
            </XStack>
          </XStack>

          <XStack items="center" gap="$3">
            <Text fontSize="$2" color="$color10" width={20}>
              1
            </Text>
            <YStack flex={1}>
              <Slider
                value={[value[dimension.key]]}
                onValueChange={(newValue) => handleSliderChange(dimension.key, newValue)}
                min={1}
                max={5}
                step={1}
                disabled={disabled}
              >
                <Slider.Track height={8}>
                  <Slider.TrackActive />
                </Slider.Track>
                <Slider.Thumb index={0} circular size={24} />
              </Slider>
            </YStack>
            <Text fontSize="$2" color="$color10" width={20}>
              5
            </Text>
          </XStack>
        </YStack>
      ))}

      <YStack gap="$2" p="$3" borderWidth={1} borderColor="$blue6">
        <Text fontSize="$3" fontWeight="600" color="$blue11">
          💡 What is RIASEC?
        </Text>
        <Text fontSize="$2" color="$blue11">
          RIASEC (Holland Codes) is a career interest model that helps match your personality to
          compatible occupations. Your scores help us recommend careers that align with your natural
          interests and work style.
        </Text>
      </YStack>
    </YStack>
  )
}
