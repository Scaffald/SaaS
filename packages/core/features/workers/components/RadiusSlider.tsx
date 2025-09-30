import { Slider, Text, XStack, YStack } from '@app/ui'

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
    <YStack gap="$2" width="100%">
      <XStack justify="space-between" items="center">
        <Text fontSize="$3" fontWeight="600" color="$color11">
          Search Radius
        </Text>
        <Text fontSize="$3" fontWeight="600" color="$blue10">
          {formatRadius(value)}
        </Text>
      </XStack>

      <Slider
        value={[value]}
        onValueChange={(values) => {
          const newValue = values[0]
          onValueChange(newValue)
        }}
        min={min}
        max={max}
        step={step}
        width="100%"
        height={20}
        bg="$color3"
        rounded="$2"
      >
        <Slider.Track>
          <Slider.TrackActive bg="$blue9" />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          bg="$blue10"
          borderWidth={2}
          borderColor="$blue11"
          rounded="$10"
          width={20}
          height={20}
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        />
      </Slider>

      <XStack justify="space-between" items="center">
        <Text fontSize="$2" color="$color10">
          {formatRadius(min)}
        </Text>
        <Text fontSize="$2" color="$color10">
          {formatRadius(max)}
        </Text>
      </XStack>
    </YStack>
  )
}
