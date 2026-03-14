import { Button, Text, ToggleSwitch, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check, X } from 'lucide-react-native'
import { useState } from 'react'

interface CapabilityQuestionInputProps {
  question: string
  value?: boolean
  onChange: (value: boolean) => void
}

export function CapabilityQuestionInput({
  question,
  value,
  onChange,
}: CapabilityQuestionInputProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [localValue, setLocalValue] = useState<boolean | undefined>(value)

  const handleValueChange = (newValue: boolean) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <Stack gap={8}>
      <Text>{question}</Text>
      <Row gap={8} align="center">
        <Button
          style={{ flex: 1 }}
          color={localValue === true ? 'primary' : undefined}
          variant={localValue === true ? undefined : 'outline'}
          onPress={() => handleValueChange(true)}
          iconStart={localValue === true ? Check : undefined}
        >
          Yes
        </Button>
        <Button
          style={{ flex: 1 }}
          color={localValue === false ? 'error' : undefined}
          variant={localValue === false ? undefined : 'outline'}
          onPress={() => handleValueChange(false)}
          iconStart={localValue === false ? X : undefined}
        >
          No
        </Button>
      </Row>
      {/* Alternative: Toggle Switch */}
      <Row justify="space-between" align="center" marginTop={8}>
        <Text style={{ color: colors.text[t].secondary }}>Toggle answer</Text>
        <ToggleSwitch checked={localValue ?? false} onChange={handleValueChange} />
      </Row>
    </Stack>
  )
}
