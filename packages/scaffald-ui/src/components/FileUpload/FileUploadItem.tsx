/**
 * FileUploadItem component
 * Individual file display with icon, info, progress, and remove button
 *
 * @example
 * ```tsx
 * import { FileUploadItem } from '@scaffald/ui'
 *
 * <FileUploadItem
 *   file={uploadedFile}
 *   onRemove={() => handleRemove(file.id)}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { X, CheckCircle, AlertCircle } from 'lucide-react-native'
import type { FileUploadItemProps } from './FileUpload.types'
import { FileUploadProgress } from './FileUploadProgress'
import { getFileIcon, formatFileSize } from './FileUpload.utils'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

/**
 * FileUploadItem component
 */
export function FileUploadItem({
  file,
  onRemove,
  variant = 'default',
  disabled = false,
  style,
}: FileUploadItemProps) {
  const [isRemoveHovered, setIsRemoveHovered] = useState(false)
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get file icon
  const FileIconComponent = getFileIcon(file.type)

  // Determine icon size based on variant
  const iconSize = variant === 'featured-icon' ? 48 : 40

  // Get status-specific colors and text
  const getStatusInfo = () => {
    switch (file.status) {
      case 'uploading':
        return {
          text: 'Uploading...',
          color: colors.primary[500],
          showProgress: true,
          icon: null,
        }
      case 'success':
        return {
          text: 'Upload complete',
          color: colors.success[500],
          showProgress: false,
          icon: CheckCircle,
        }
      case 'error':
        return {
          text: file.error || 'Upload failed',
          color: colors.error[500],
          showProgress: false,
          icon: AlertCircle,
        }
      default:
        return {
          text: formatFileSize(file.size),
          color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
          showProgress: false,
          icon: null,
        }
    }
  }

  const statusInfo = getStatusInfo()

  // Get text colors
  const fileNameColor = isLight ? colors.text.light.primary : colors.text.dark.primary
  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  // Get size text for uploading state
  const getSizeText = () => {
    if (file.status === 'uploading' && file.uploadedSize !== undefined) {
      return `${formatFileSize(file.uploadedSize)} of ${formatFileSize(file.size)}`
    }
    return formatFileSize(file.size)
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {/* File icon */}
        <View
          style={[
            styles.iconContainer,
            {
              width: iconSize,
              height: iconSize,
            },
          ]}
        >
          <FileIconComponent size={iconSize * 0.6} color={iconColor} />
        </View>

        {/* File info */}
        <View style={styles.content}>
          <Text style={[styles.fileName, { color: fileNameColor }]} numberOfLines={1}>
            {file.name}
          </Text>

          <View style={styles.statusRow}>
            {/* Status icon */}
            {statusInfo.icon && (
              <statusInfo.icon size={14} color={statusInfo.color} style={styles.statusIcon} />
            )}

            {/* Status text */}
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>

            {/* Progress percentage for uploading */}
            {file.status === 'uploading' && file.progress !== undefined && (
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {' '}
                · {Math.round(file.progress)}%
              </Text>
            )}

            {/* File size */}
            {file.status !== 'error' && (
              <Text
                style={[
                  styles.sizeText,
                  { color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary },
                ]}
              >
                {' '}
                · {getSizeText()}
              </Text>
            )}
          </View>
        </View>

        {/* Remove button */}
        {onRemove && (
          <Pressable
            onPress={onRemove}
            disabled={disabled}
            style={({ pressed }) => [
              styles.removeButton,
              isRemoveHovered && {
                backgroundColor: isLight ? colors.bg.light.subtle : colors.bg.dark.subtle,
              },
              pressed && !disabled && { opacity: 0.8 },
            ]}
            {...(Platform.OS === 'web' && {
              onMouseEnter: () => setIsRemoveHovered(true),
              onMouseLeave: () => setIsRemoveHovered(false),
            })}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${file.name}`}
          >
            <X
              size={16}
              color={isLight ? colors.icon.light.default : colors.icon.dark.default}
            />
          </Pressable>
        )}
      </View>

      {/* Progress bar */}
      {statusInfo.showProgress && file.progress !== undefined && (
        <View style={styles.progressContainer}>
          <FileUploadProgress progress={file.progress} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.light.default,
    borderRadius: borderRadius.s,
    borderWidth: 1,
    borderColor: colors.border.light['200'],
    padding: spacing[12],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing[4],
  },
  fileName: {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: spacing[4],
  },
  statusText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  sizeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  removeButton: {
    padding: spacing[4],
    borderRadius: borderRadius.s,
  },
  progressContainer: {
    marginTop: spacing[8],
  },
})
