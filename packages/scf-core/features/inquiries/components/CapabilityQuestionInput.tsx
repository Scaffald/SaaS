import { Button, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { Check, X } from '@tamagui/lucide-icons'
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
  const [localValue, setLocalValue] = useState<boolean | undefined>(value)

  const handleValueChange = (newValue: boolean) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <Stack gap="$2">
      <Text fontSize="$3" fontWeight="600">
        {question}
      </Text>
      <Row gap="$2" alignItems="center">
        <Button
          flex={1}
          theme={localValue === true ? 'success' : undefined}
          variant={localValue === true ? undefined : 'outlined'}
          onPress={() => handleValueChange(true)}
          icon={localValue === true ? Check : undefined}
        >
          Yes
        </Button>
        <Button
          flex={1}
          theme={localValue === false ? 'error' : undefined}
          variant={localValue === false ? undefined : 'outlined'}
          onPress={() => handleValueChange(false)}
          icon={localValue === false ? X : undefined}
        >
          No
        </Button>
      </Row>
      {/* Alternative: Toggle Switch */}
      <Row justifyContent="space-between" alignItems="center" marginTop="$2">
        <Text fontSize="$3" color="$color11">
          Toggle answer
        </Text>
        <ToggleSwitch checked={localValue ?? false} onCheckedChange={handleValueChange} />
      </Row>
    </Stack>
  )
}
