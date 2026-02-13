import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label, Slider } from '@unicornlove/beyond-ui'

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
    <Stack gap={16} padding="md">
      <Stack gap={8}>
        <Row gap={8}>
          <Label flex={1}>Minimum Score</Label>
          <Text>{currentScore}</Text>
        </Row>
        <Text>Set the minimum score threshold for auto-screening applicants (0-100 scale)</Text>
      </Stack>

      <Stack gap={12}>
        <Slider value={value} onValueChange={handleChange} min={0} max={100} step={1} width="100%">
          <Slider.Track>
            <Slider.TrackActive />
          </Slider.Track>
          <Slider.Thumb circular index={0} />
        </Slider>

        <Row gap={8}>
          <Text flex={1}>0 (Low)</Text>
          <Text>100 (High)</Text>
        </Row>
      </Stack>

      <Stack gap={8} padding="sm">
        <Text color="$blue11">Score Guidelines</Text>
        <Text color="$blue11">
          • <Text>0-25:</Text> Entry level, minimal requirements
        </Text>
        <Text color="$blue11">
          • <Text>26-50:</Text> Some experience required
        </Text>
        <Text color="$blue11">
          • <Text>51-75:</Text> Experienced candidates preferred
        </Text>
        <Text color="$blue11">
          • <Text>76-100:</Text> Highly qualified candidates only
        </Text>
      </Stack>
    </Stack>
  )
}
