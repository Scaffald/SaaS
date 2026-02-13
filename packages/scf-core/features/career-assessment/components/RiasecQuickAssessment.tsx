import { Slider, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
    <Stack gap={16} width="100%">
      <Stack gap={8}>
        <Text color="$gray11">Rate Your Interests</Text>
        <Text color="$gray11">
          Move the sliders to indicate how much you agree with each statement (1 = Disagree, 5 =
          Strongly Agree)
        </Text>
      </Stack>

      {RIASEC_DIMENSIONS.map((dimension) => (
        <Stack key={dimension.key} gap={12}>
          <Row gap={12} align="center">
            <Stack flex={1} gap={4}>
              <Text>{dimension.label}</Text>
              <Text color="$gray11">{dimension.description}</Text>
            </Stack>
            <Row
              width={60}
              height={32}
              align="center"
              borderWidth={1}
              borderColor="$borderColor"
              paddingHorizontal={8}
            >
              <Text>{value[dimension.key]}</Text>
            </Row>
          </Row>

          <Row align="center" gap={12}>
            <Text color="$gray11" width={20}>
              1
            </Text>
            <Stack flex={1}>
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
                <Slider.Thumb index={0} size={24} />
              </Slider>
            </Stack>
            <Text color="$gray11" width={20}>
              5
            </Text>
          </Row>
        </Stack>
      ))}

      <Stack gap={8} padding="sm" borderWidth={1} borderColor="$blue6">
        <Text color="$blue11">💡 What is RIASEC?</Text>
        <Text color="$blue11">
          RIASEC (Holland Codes) is a career interest model that helps match your personality to
          compatible occupations. Your scores help us recommend careers that align with your natural
          interests and work style.
        </Text>
      </Stack>
    </Stack>
  )
}
