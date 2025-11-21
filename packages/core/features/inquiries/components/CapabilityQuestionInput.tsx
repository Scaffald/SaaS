import { Button, Text, ToggleSwitch, XStack, YStack } from '@app/ui'
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
    <YStack gap="$2">
      <Text fontSize="$3" fontWeight="600">
        {question}
      </Text>
      <XStack gap="$2" items="center">
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
      </XStack>
      {/* Alternative: Toggle Switch */}
      <XStack justify="space-between" items="center" mt="$2">
        <Text fontSize="$3" color="$color11">
          Toggle answer
        </Text>
        <ToggleSwitch checked={localValue ?? false} onCheckedChange={handleValueChange} />
      </XStack>
    </YStack>
  )
}
