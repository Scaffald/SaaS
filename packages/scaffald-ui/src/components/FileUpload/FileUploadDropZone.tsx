/**
 * FileUploadDropZone component (Base version for React Native)
 * Clickable area for file selection
 *
 * Note: This is the base React Native version.
 * The web version with drag-and-drop is in FileUploadDropZone.web.tsx
 *
 * @example
 * ```tsx
 * import { FileUploadDropZone } from '@scaffald/ui'
 *
 * <FileUploadDropZone
 *   onFilesSelected={(files) => handleFiles(files)}
 *   message="Tap to choose files"
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { Upload } from 'lucide-react-native'
import type { FileUploadDropZoneProps } from './FileUpload.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

// Purple/Violet accent color for drop zone border (from Figma design)
const DROPZONE_BORDER_COLOR = '#8b5cf6'

/**
 * FileUploadDropZone component
 */
export function FileUploadDropZone({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  isDragging = false,
  onDragEnter,
  onDragLeave,
  icon: CustomIcon,
  message = 'Drag & drop or choose files to upload',
  helperText = 'Max file size 1MB',
  style,
}: FileUploadDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Icon component (custom or default Upload)
  const IconComponent = CustomIcon || Upload

  // Get colors based on state
  const getBackgroundColor = () => {
    if (disabled) {
      return isLight ? colors.bg.light.muted : colors.bg.dark.muted
    }
    if (isDragging) {
      return colors.primary[50]
    }
    if (isHovered) {
      return isLight ? colors.bg.light.subtle : colors.bg.dark.subtle
    }
    return isLight ? colors.bg.light.default : colors.bg.dark.default
  }

  const getBorderColor = () => {
    if (isDragging) {
      return colors.primary[500]
    }
    return DROPZONE_BORDER_COLOR
  }

  const iconColor = disabled
    ? isLight
      ? colors.icon.light.disabled
      : colors.icon.dark.disabled
    : isLight
      ? colors.icon.light.default
      : colors.icon.dark.default

  const messageColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.text.light.secondary
      : colors.text.dark.secondary

  const helperTextColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.text.light.tertiary
      : colors.text.dark.tertiary

  // Handle press (for React Native, this would trigger a file picker library)
  const handlePress = () => {
    if (disabled) return

    // Note: In a real React Native implementation, you would use a library like:
    // import DocumentPicker from 'react-native-document-picker'
    // const result = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles], allowMultiSelection: multiple })
    // onFilesSelected(result)

    // For now, this is a placeholder that the web version will override
    console.warn('FileUploadDropZone: File picker not implemented for React Native')
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        disabled && styles.containerDisabled,
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
      accessibilityRole="button"
      accessibilityLabel={message}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <IconComponent size={40} color={iconColor} />
        </View>

        {/* Message */}
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>

        {/* Helper text */}
        {helperText && (
          <Text style={[styles.helperText, { color: helperTextColor }]}>{helperText}</Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.l,
    padding: spacing[32],
    minHeight: 146,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerDisabled: {
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
  },
  iconContainer: {
    marginBottom: spacing[8],
  },
  message: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
    textAlign: 'center',
  },
  helperText: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    textAlign: 'center',
  },
})
