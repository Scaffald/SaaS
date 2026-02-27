/**
 * FileUpload component
 * Complete file upload component with drag-and-drop, progress tracking, and validation
 *
 * @example
 * ```tsx
 * import { FileUpload } from '@scaffald/ui'
 *
 * // Uncontrolled mode
 * <FileUpload
 *   onFilesSelected={(files) => uploadFiles(files)}
 *   accept="image/*,application/pdf"
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   multiple
 * />
 *
 * // Controlled mode
 * <FileUpload
 *   files={uploadedFiles}
 *   onFilesSelected={(files) => setUploadedFiles([...uploadedFiles, ...files])}
 *   onFileRemove={(fileId) => setUploadedFiles(files.filter(f => f.id !== fileId))}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text } from 'react-native'
import type { FileUploadProps, UploadedFile } from './FileUpload.types'
import { FileUploadDropZone } from './FileUploadDropZone'
import { FileUploadList } from './FileUploadList'
import { validateFile, fileToUploadedFile } from './FileUpload.utils'
import { useThemeContext } from '../../theme'
import { getFileUploadStyles } from './FileUpload.styles'

/**
 * FileUpload component
 */
export function FileUpload({
  // File handling callbacks
  onFilesSelected,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onFileRemove,

  // File restrictions
  accept,
  maxSize,
  maxFiles,
  multiple = true,

  // State management
  files: controlledFiles,
  defaultFiles = [],
  disabled = false,
  error: externalError,

  // Content customization
  label,
  helperText,
  icon,
  emptyMessage,

  // Styling
  variant = 'default',
  style,
  dropZoneStyle,
}: FileUploadProps) {
  // Controlled/uncontrolled state pattern
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>(defaultFiles)
  const files = controlledFiles !== undefined ? controlledFiles : internalFiles
  const isControlled = controlledFiles !== undefined

  // Internal error state for validation errors
  const [validationError, setValidationError] = useState<string | null>(null)

  // Determine which error to show (external or validation)
  const errorMessage = externalError || validationError

  const { theme } = useThemeContext()

  // Get styles from factory function
  const styles = getFileUploadStyles(theme, disabled)

  // Handle file selection
  const handleFilesSelected = (selectedFiles: File[]) => {
    // Clear previous validation errors
    setValidationError(null)

    // Check max files limit
    if (maxFiles && files.length + selectedFiles.length > maxFiles) {
      setValidationError(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`)
      return
    }

    // Validate each file
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of selectedFiles) {
      const error = validateFile(file, accept, maxSize)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // If there are validation errors, show them
    if (errors.length > 0) {
      setValidationError(errors.join('\n'))
      // Still add valid files if any
      if (validFiles.length === 0) return
    }

    // Convert valid files to UploadedFile objects
    const newUploadedFiles = validFiles.map(fileToUploadedFile)

    // Update state if uncontrolled
    if (!isControlled) {
      setInternalFiles([...files, ...newUploadedFiles])
    }

    // Call callback with original File objects
    onFilesSelected?.(validFiles)
  }

  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    // Clear validation error when removing files
    setValidationError(null)

    // Update state if uncontrolled
    if (!isControlled) {
      setInternalFiles(files.filter((f) => f.id !== fileId))
    }

    // Call callback
    onFileRemove?.(fileId)
  }

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Drop zone (only show if not at max files) */}
      {(!maxFiles || files.length < maxFiles) && (
        <FileUploadDropZone
          onFilesSelected={handleFilesSelected}
          accept={accept}
          multiple={multiple && (!maxFiles || files.length + 1 < maxFiles)}
          disabled={disabled}
          icon={icon}
          message={emptyMessage}
          helperText={helperText}
          style={dropZoneStyle}
        />
      )}

      {/* File list */}
      {files.length > 0 && (
        <View style={styles.listContainer}>
          <FileUploadList
            files={files}
            onFileRemove={handleFileRemove}
            variant={variant}
            disabled={disabled}
          />
        </View>
      )}

      {/* Error message */}
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  )
}

