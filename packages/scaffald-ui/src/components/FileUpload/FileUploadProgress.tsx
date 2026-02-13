/**
 * FileUploadProgress component
 * Visual progress indicator for file upload
 *
 * @example
 * ```tsx
 * import { FileUploadProgress } from '@scaffald/ui'
 *
 * <FileUploadProgress progress={40} />
 * <FileUploadProgress progress={75} color="#8b5cf6" height={6} />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { FileUploadProgressProps } from './FileUpload.types'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'

/**
 * FileUploadProgress component
 */
export function FileUploadProgress({
  progress,
  color = colors.primary[500], // Orange by default
  height = 4,
  style,
}: FileUploadProgressProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.bg.light.muted,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: borderRadius.max,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: borderRadius.max,
  },
})
