import { Slider, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type RadiusSliderProps = {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const formatRadius = (meters: number): string => {
  const miles = meters / 1609.34
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10} mi`
  }
  return `${Math.round(miles)} mi`
}

export const RadiusSlider = ({
  value,
  onValueChange,
  min = 1000, // 1km
  max = 100000, // 100km
  step = 1000,
}: RadiusSliderProps) => {
  const { theme } = useThemeContext()
  return (
    <Stack gap={8} flex={1}>
      <Row justify="space-between" align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Search Radius</Text>
        <Text style={{ color: colors.text[theme].info }}>{formatRadius(value)}</Text>
      </Row>

      <Slider
        value={[value]}
        onValueChange={(values) => {
          const newValue = values[0]
          onValueChange(newValue)
        }}
        min={min}
        max={max}
        step={step}
        flex={1}
        height={20}
        backgroundColor="$color3"
        borderRadius={8}
      >
        <Slider.Track>
          <Slider.TrackActive style={{ backgroundColor: colors.bg[theme].info }} />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          style={{ backgroundColor: colors.bg[theme].info }}
          borderWidth={2}
          borderColor={colors.border[theme].info}
          borderRadius="$10"
          width={20}
          height={20}
        />
      </Slider>

      <Row justify="space-between" align="center">
        <Text style={{ color: colors.text[theme].secondary }}>{formatRadius(min)}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{formatRadius(max)}</Text>
      </Row>
    </Stack>
  )
}
