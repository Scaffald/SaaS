/**
 * RichTextEditor – minimal plain-text editor by default.
 * No TipTap dependency. For full rich text, render a TipTap editor as children.
 */

import { View, TextInput, Text } from 'react-native'
import type { RichTextEditorProps } from './RichTextEditor.types'

const DEFAULT_MIN_HEIGHT = 120

export function RichTextEditor({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  minHeight = DEFAULT_MIN_HEIGHT,
  error,
  errorMessage,
  showCharacterCount = false,
  maxLength,
  style,
  children,
}: RichTextEditorProps) {
  if (children != null) {
    return <View style={style}>{children}</View>
  }

  const displayError = typeof error === 'string' ? error : errorMessage
  const count = value.length

  return (
    <View style={[{ minHeight }, style]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        editable={!disabled && !readOnly}
        multiline
        maxLength={maxLength}
        style={{
          minHeight,
          padding: 12,
          fontSize: 14,
          color: '#111827',
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: displayError ? '#dc2626' : '#e5e7eb',
          borderRadius: 8,
          textAlignVertical: 'top',
        }}
      />
      {(showCharacterCount && maxLength != null) && (
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          {count} / {maxLength}
        </Text>
      )}
      {displayError && (
        <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{displayError}</Text>
      )}
    </View>
  )
}
