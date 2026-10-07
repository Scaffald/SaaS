import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { useState } from 'react'
import { Label, Slider } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ScoreThresholdSectionProps {
  minimumScore?: number
  onUpdate: (score?: number) => void
}

export function ScoreThresholdSection({ minimumScore, onUpdate }: ScoreThresholdSectionProps) {
  const { theme } = useThemeContext()
  const [value, setValue] = useState<number>(minimumScore ?? 50)

  const handleChange = (newValue: number) => {
    setValue(newValue)
    onUpdate(newValue)
  }

  return (
    <Stack gap={16} padding="md">
      <Stack gap={8}>
        <Row gap={8}>
          <Label style={{ flex: 1 }}>Minimum Score</Label>
          <Text>{value}</Text>
        </Row>
        <Text>Set the minimum score threshold for auto-screening applicants (0-100 scale)</Text>
      </Stack>

      <Stack gap={12}>
        <Slider value={value} onValueChange={handleChange} min={0} max={100} step={1} />

        <Row gap={8}>
          <Text style={{ flex: 1 }}>0 (Low)</Text>
          <Text>100 (High)</Text>
        </Row>
      </Stack>

      <Stack gap={8} padding="sm">
        <Text style={{ color: colors.text[theme].emphasis }}>Score Guidelines</Text>
        <Text style={{ color: colors.text[theme].emphasis }}>
          • <Text>0-25:</Text> Entry level, minimal requirements
        </Text>
        <Text style={{ color: colors.text[theme].emphasis }}>
          • <Text>26-50:</Text> Some experience required
        </Text>
        <Text style={{ color: colors.text[theme].emphasis }}>
          • <Text>51-75:</Text> Experienced candidates preferred
        </Text>
        <Text style={{ color: colors.text[theme].emphasis }}>
          • <Text>76-100:</Text> Highly qualified candidates only
        </Text>
      </Stack>
    </Stack>
  )
}
