import { Slider, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { RIASEC_DIMENSIONS, type RiasecScores } from '../config/career-assessment-schema'

/** Scores in progress: a dimension the user has not rated yet is null (#1173). */
type RiasecValue = { [K in keyof RiasecScores]: number | null }

interface RiasecQuickAssessmentProps<T extends RiasecValue> {
  value: T
  onChange: (scores: T) => void
  disabled?: boolean
}

/**
 * RiasecQuickAssessment Component
 *
 * Displays 6 interactive sliders for rating RIASEC interest dimensions (1-5 scale)
 * Used for quick career interest assessment
 *
 * A dimension whose value is null reads "Not set" until the user moves its
 * slider. The value shows once, in the box beside the label: the slider's
 * own tooltip repeated it (#1173).
 *
 * @param value - Current RIASEC scores
 * @param onChange - Callback when scores change
 * @param disabled - Whether sliders are disabled
 */
export function RiasecQuickAssessment<T extends RiasecValue>({
  value,
  onChange,
  disabled = false,
}: RiasecQuickAssessmentProps<T>) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const handleSliderChange = (key: keyof RiasecScores, newValue: number) => {
    onChange({
      ...value,
      [key]: newValue,
    } as T)
  }

  return (
    <Stack gap={16} width="100%">
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Rate Your Interests</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Move the sliders to indicate how much you agree with each statement (1 = Disagree, 5 =
          Strongly Agree)
        </Text>
      </Stack>

      {RIASEC_DIMENSIONS.map((dimension) => {
        const rating = value[dimension.key]
        return (
          <Stack key={dimension.key} gap={12}>
            <Row gap={12} align="center">
              <Stack style={{ flex: 1 }} gap={4}>
                <Text>{dimension.label}</Text>
                <Text style={{ color: colors.text[t].secondary }}>{dimension.description}</Text>
              </Stack>
              <Row
                minWidth={60}
                height={32}
                align="center"
                justify="center"
                style={{
                  borderWidth: 1,
                  borderColor: colors.border[t].default,
                  paddingHorizontal: 8,
                }}
              >
                {rating == null ? (
                  <Text style={{ color: colors.text[t].tertiary }}>Not set</Text>
                ) : (
                  <Text>{rating}</Text>
                )}
              </Row>
            </Row>

            <Row align="center" gap={12}>
              <Text style={{ color: colors.text[t].secondary, width: 20 }}>1</Text>
              <Stack style={{ flex: 1 }}>
                <Slider
                  value={rating ?? undefined}
                  showIndicator={false}
                  onValueChange={(newValue) => handleSliderChange(dimension.key, newValue)}
                  min={1}
                  max={5}
                  step={1}
                  disabled={disabled}
                />
              </Stack>
              <Text style={{ color: colors.text[t].secondary, width: 20 }}>5</Text>
            </Row>
          </Stack>
        )
      })}

      <Stack
        gap={8}
        padding="sm"
        style={{ borderWidth: 1, borderColor: t === 'dark' ? colors.blue[800] : colors.blue[200] }}
      >
        <Text style={{ color: colors.text[t].emphasis }}>What is RIASEC?</Text>
        <Text style={{ color: colors.text[t].emphasis }}>
          RIASEC (Holland Codes) is a career interest model that helps match your personality to
          compatible occupations. Your scores help us recommend careers that align with your natural
          interests and work style.
        </Text>
      </Stack>
    </Stack>
  )
}
