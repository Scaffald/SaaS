import { Text, XStack, YStack } from '@unicornlove/ui'
import { useState } from 'react'
import { Label, Slider } from '@unicornlove/ui'

interface ScoreThresholdSectionProps {
  minimumScore?: number
  onUpdate: (score?: number) => void
}

export function ScoreThresholdSection({ minimumScore, onUpdate }: ScoreThresholdSectionProps) {
  const [value, setValue] = useState<number[]>([minimumScore || 50])

  const handleChange = (newValue: number[]) => {
    setValue(newValue)
    onUpdate(newValue[0])
  }

  const currentScore = value[0] || 50

  return (
    <YStack gap="$4" padding="$4">
      <YStack gap="$2">
        <XStack gap="$2">
          <Label fontSize="$5" fontWeight="600" flex={1}>
            Minimum Score
          </Label>
          <Text fontSize="$6" fontWeight="700">
            {currentScore}
          </Text>
        </XStack>
        <Text fontSize="$2">
          Set the minimum score threshold for auto-screening applicants (0-100 scale)
        </Text>
      </YStack>

      <YStack gap="$3">
        <Slider value={value} onValueChange={handleChange} min={0} max={100} step={1} width="100%">
          <Slider.Track>
            <Slider.TrackActive />
          </Slider.Track>
          <Slider.Thumb circular index={0} />
        </Slider>

        <XStack gap="$2">
          <Text fontSize="$1" flex={1}>
            0 (Low)
          </Text>
          <Text fontSize="$1">100 (High)</Text>
        </XStack>
      </YStack>

      <YStack gap="$2" padding="$3">
        <Text fontSize="$2" fontWeight="600" color="$blue11">
          Score Guidelines
        </Text>
        <Text fontSize="$1" color="$blue11">
          • <Text fontWeight="600">0-25:</Text> Entry level, minimal requirements
        </Text>
        <Text fontSize="$1" color="$blue11">
          • <Text fontWeight="600">26-50:</Text> Some experience required
        </Text>
        <Text fontSize="$1" color="$blue11">
          • <Text fontWeight="600">51-75:</Text> Experienced candidates preferred
        </Text>
        <Text fontSize="$1" color="$blue11">
          • <Text fontWeight="600">76-100:</Text> Highly qualified candidates only
        </Text>
      </YStack>
    </YStack>
  )
}
