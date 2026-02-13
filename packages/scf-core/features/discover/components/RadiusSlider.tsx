import { Slider, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  return (
    <Stack gap={8} flex={1}>
      <Row justify="space-between" align="center">
        <Text color="gray">Search Radius</Text>
        <Text color="$blue10">{formatRadius(value)}</Text>
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
          <Slider.TrackActive backgroundColor="$blue9" />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          backgroundColor="$blue10"
          borderWidth={2}
          borderColor="$blue11"
          borderRadius="$10"
          width={20}
          height={20}
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        />
      </Slider>

      <Row justify="space-between" align="center">
        <Text color="gray">{formatRadius(min)}</Text>
        <Text color="gray">{formatRadius(max)}</Text>
      </Row>
    </Stack>
  )
}
