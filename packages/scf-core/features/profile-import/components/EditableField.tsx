import { memo } from 'react'
import { Input, Text, TextArea, Row, Stack } from '@scaffald/ui'
import { toConfidenceLevel } from '../utils/importConfidence'
import { ConfidenceBadge } from './ConfidenceBadge'

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
    <Stack gap={8}>
      <Row justify="space-between" align="center">
        <Text>
          {label}
          {required ? ' *' : ''}
        </Text>
        <ConfidenceBadge level={confidenceLevel} />
      </Row>

      {fieldType === 'textarea' ? (
        <TextArea
          value={inputValue}
          onChangeText={onChange}
          placeholder={placeholder}
          style={{ minHeight: 120 }}
        />
      ) : (
        <Input value={inputValue} onChangeText={onChange} placeholder={placeholder} />
      )}

      {error && <Text color="$red10">{error}</Text>}
    </Stack>
  )
})
