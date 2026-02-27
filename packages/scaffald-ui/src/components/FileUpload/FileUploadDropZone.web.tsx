/**
 * FileUploadDropZone component (Web version with drag-and-drop)
 * Clickable area with HTML5 drag-and-drop support for file selection
 *
 * @example
 * ```tsx
 * import { FileUploadDropZone } from '@scaffald/ui'
 *
 * <FileUploadDropZone
 *   onFilesSelected={(files) => handleFiles(files)}
 *   accept="image/*"
 *   multiple
 * />
 * ```
 */

import { useState, useRef } from 'react'
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
 * FileUploadDropZone component (Web version)
 */
export function FileUploadDropZone({
  onFilesSelected,
  accept,
  multiple = true,
  disabled = false,
  isDragging: externalIsDragging,
  onDragEnter,
  onDragLeave,
  icon: CustomIcon,
  message = 'Drag & drop or choose files to upload',
  helperText = 'Max file size 1MB',
  style,
}: FileUploadDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [internalIsDragging, setInternalIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Use external drag state if provided, otherwise use internal
  const isDragging = externalIsDragging ?? internalIsDragging

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

  // Handle files from either drag-drop or file input
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Convert FileList to File array
    const fileArray = Array.from(files)

    // Call callback
    onFilesSelected(fileArray)
  }

  // Handle click to open file picker
  const handlePress = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files)
    // Reset input so the same file can be selected again
    event.target.value = ''
  }

  // Drag and drop handlers
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) return

    dragCounterRef.current++

    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setInternalIsDragging(true)
      onDragEnter?.()
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) return

    dragCounterRef.current--

    if (dragCounterRef.current === 0) {
      setInternalIsDragging(false)
      onDragLeave?.()
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) return

    // Show copy cursor
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (disabled) return

    // Reset drag state
    dragCounterRef.current = 0
    setInternalIsDragging(false)
    onDragLeave?.()

    // Get files from drop event
    const { files } = event.dataTransfer
    handleFiles(files)
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
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
      } as Partial<Record<string, unknown>>)}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
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
