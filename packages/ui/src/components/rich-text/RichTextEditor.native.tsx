import type React from 'react'
import { TextArea, YStack, Text, XStack } from 'tamagui'
import type { RichTextEditorProps } from './types'
import { extractPlainText, plainTextToTipTap } from './utils/sanitize'

/**
 * RichTextEditor - React Native Implementation
 *
 * This is a temporary fallback that uses a plain TextArea.
 * TODO: Implement full rich text support using @10play/tentap-editor
 *
 * @see https://github.com/10play/10tap-editor for native implementation
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  fieldType,
  showCharacterCount = false,
  minHeight = 100,
  disabled = false,
  error,
  placeholder = 'Enter text...',
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
      PROFILE_ABOUT: 500,
      EXPERIENCE_DESCRIPTION: 1000,
      EDUCATION_DESCRIPTION: 500,
      JOB_DESCRIPTION: 3000,
      ORGANIZATION_DESCRIPTION: 1000,
    }
    return limits[fieldType] || 500
  }

  const characterLimit = getCharacterLimit()
  const characterCount = plainText.length

  return (
    <YStack gap="$2">
      <TextArea
        value={plainText}
        onChangeText={handleChange}
        placeholder={placeholder}
        height={minHeight}
        disabled={disabled}
        borderColor={error ? '$red8' : '$borderColor'}
        numberOfLines={6}
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
