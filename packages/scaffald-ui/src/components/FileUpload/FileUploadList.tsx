/**
 * FileUploadList component
 * Container for displaying multiple uploaded files
 *
 * @example
 * ```tsx
 * import { FileUploadList } from '@scaffald/ui'
 *
 * <FileUploadList
 *   files={uploadedFiles}
 *   onFileRemove={(fileId) => handleRemove(fileId)}
 * />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { FileUploadListProps } from './FileUpload.types'
import { FileUploadItem } from './FileUploadItem'
import { spacing } from '../../tokens/spacing'

/**
 * FileUploadList component
 */
export function FileUploadList({
  files,
  onFileRemove,
  variant = 'default',
  disabled = false,
  style,
}: FileUploadListProps) {
  // Don't render anything if there are no files
  if (files.length === 0) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      {files.map((file) => (
        <FileUploadItem
          key={file.id}
          file={file}
          onRemove={onFileRemove ? () => onFileRemove(file.id) : undefined}
          variant={variant}
          disabled={disabled}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[12],
  },
})
