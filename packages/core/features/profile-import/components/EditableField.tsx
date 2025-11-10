import { memo } from 'react'
import { Input, TextArea, XStack, YStack, Text } from 'tamagui'
import { ConfidenceBadge } from './ConfidenceBadge'
import { toConfidenceLevel } from '../utils/importConfidence'

export type EditableFieldType = 'text' | 'textarea' | 'date'

export interface EditableFieldProps {
  label: string
  value: string | null | undefined
  fieldType?: EditableFieldType
  onChange: (value: string) => void
  confidenceScore?: number | null
  placeholder?: string
  error?: string | null
  required?: boolean
}

export const EditableField = memo(function EditableField({
  label,
  value,
  fieldType = 'text',
  onChange,
  confidenceScore,
  placeholder,
  error,
  required = false,
}: EditableFieldProps) {
  const confidenceLevel = toConfidenceLevel(confidenceScore)
  const inputValue = value ?? ''

  return (
    <YStack gap="$2">
      <XStack justify="space-between" items="center">
        <Text fontWeight="600">
          {label}
          {required ? ' *' : ''}
        </Text>
        <ConfidenceBadge level={confidenceLevel} />
      </XStack>

      {fieldType === 'textarea' ? (
        <TextArea
          value={inputValue}
          onChangeText={onChange}
          placeholder={placeholder}
          style={{ minHeight: 120 }}
        />
      ) : (
        <Input
          value={inputValue}
          onChangeText={onChange}
          placeholder={placeholder}
        />
      )}

      {error && (
        <Text color="$red10" fontSize="$2">
          {error}
        </Text>
      )}
    </YStack>
  )
})


