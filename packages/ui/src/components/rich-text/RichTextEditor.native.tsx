import type { FC } from 'react'
import { Text, TextArea, XStack, YStack } from 'tamagui'
import type { RichTextEditorProps } from './types'
import { extractPlainText, plainTextToTipTap } from './utils/sanitize'

/**
 * RichTextEditor - React Native Implementation
 *
 * Native currently renders a plain textarea-style input and converts
 * the value to TipTap JSON so the web client can apply rich formatting.
 */
export const RichTextEditor: FC<RichTextEditorProps> = ({
  value,
  onChange,
  fieldType,
  showCharacterCount = false,
  minHeight = 100,
  disabled = false,
  readOnly = false,
  error,
  placeholder = 'Enter text...',
  maxLength,
  autoFocus = false,
  testID,
}) => {
  // Extract plain text from TipTap JSON or use directly if string
  const plainText = value ? extractPlainText(value) : ''

  const handleChange = (text: string) => {
    // Convert plain text to TipTap JSON format when user types
    const jsonContent = plainTextToTipTap(text)
    onChange?.(jsonContent)
  }

  // Get character limit based on field type
  const getCharacterLimit = (): number => {
    const limits: Record<string, number> = {
      PROFILE_ABOUT: 1500,
      EXPERIENCE_DESCRIPTION: 1000,
      EDUCATION_DESCRIPTION: 500,
      JOB_DESCRIPTION: 3000,
      ORGANIZATION_DESCRIPTION: 1000,
    }
    return limits[fieldType] || 500
  }

  const characterLimit = maxLength ?? getCharacterLimit()
  const characterCount = plainText.length
  const isDisabled = disabled || readOnly

  return (
    <YStack gap="$2" testID={testID}>
      <TextArea
        value={plainText}
        onChangeText={handleChange}
        placeholder={placeholder}
        height={minHeight}
        disabled={isDisabled}
        borderColor={error ? '$red8' : '$borderColor'}
        numberOfLines={6}
        multiline
        autoFocus={autoFocus}
        maxLength={characterLimit}
        textAlignVertical="top"
      />

      {/* Character Count and Error */}
      <XStack justify="space-between" items="center">
        {error && (
          <Text color="$red10" fontSize="$2" flex={1}>
            {error}
          </Text>
        )}
        {showCharacterCount && (
          <Text
            color={characterCount > characterLimit ? '$red10' : '$color11'}
            fontSize="$2"
            ml="auto"
          >
            {characterCount} / {characterLimit}
          </Text>
        )}
      </XStack>

      {/* Native Implementation Notice */}
      <Text color="$color10" fontSize="$1" fontStyle="italic">
        Note: Rich text formatting (bold, italic, lists) will be available in a future update. Your
        text will be saved and can be formatted on the web version.
      </Text>
    </YStack>
  )
}
