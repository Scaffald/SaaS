/**
 * FileUpload component types
 * Type definitions for file upload component and sub-components
 */

import type { ViewStyle } from 'react-native'

/**
 * File upload status
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * File upload variant
 */
export type FileUploadVariant = 'default' | 'featured-icon'

/**
 * Uploaded file object
 */
export interface UploadedFile {
  /** Unique identifier for the file */
  id: string
  /** File name */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type of the file */
  type: string
  /** Original File object (web) */
  file: File
  /** Upload status */
  status: FileUploadStatus
  /** Upload progress (0-100) */
  progress?: number
  /** Error message if status is 'error' */
  error?: string
  /** Uploaded size in bytes (for showing "XMB of YMB") */
  uploadedSize?: number
}

/**
 * Main FileUpload component props
 */
export interface FileUploadProps {
  // File handling callbacks
  /** Called when files are selected/dropped */
  onFilesSelected?: (files: File[]) => void
  /** Called during upload progress */
  onUploadProgress?: (fileId: string, progress: number) => void
  /** Called when upload completes successfully */
  onUploadComplete?: (fileId: string) => void
  /** Called when upload fails */
  onUploadError?: (fileId: string, error: string) => void
  /** Called when a file is removed */
  onFileRemove?: (fileId: string) => void

  // File restrictions
  /** Accepted file types (e.g., "image/*,application/pdf") */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files allowed */
  maxFiles?: number
  /** Allow multiple file selection */
  multiple?: boolean

  // State management
  /** Current files (controlled mode) */
  files?: UploadedFile[]
  /** Default files (uncontrolled mode) */
  defaultFiles?: UploadedFile[]
  /** Disable the component */
  disabled?: boolean
  /** Error message to display */
  error?: string

  // Content customization
  /** Label text above the upload area */
  label?: string
  /** Helper text below the message (e.g., "Max file size 1MB") */
  helperText?: string
  /** Custom icon component for drop zone */
  icon?: React.ComponentType<{ size: number; color: string }>
  /** Empty state message */
  emptyMessage?: string

  // Styling
  /** Visual variant */
  variant?: FileUploadVariant
  /** Container style */
  style?: ViewStyle
  /** Drop zone style */
  dropZoneStyle?: ViewStyle
}

/**
 * FileUploadDropZone component props
 */
export interface FileUploadDropZoneProps {
  /** Called when files are selected */
  onFilesSelected: (files: File[]) => void
  /** Accepted file types */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Disable the drop zone */
  disabled?: boolean
  /** Drag over state */
  isDragging?: boolean
  /** Called when drag enters */
  onDragEnter?: () => void
  /** Called when drag leaves */
  onDragLeave?: () => void
  /** Custom icon component */
  icon?: React.ComponentType<{ size: number; color: string }>
  /** Main message text */
  message?: string
  /** Helper text below message */
  helperText?: string
  /** Custom style */
  style?: ViewStyle
}

/**
 * FileUploadList component props
 */
export interface FileUploadListProps {
  /** Array of files to display */
  files: UploadedFile[]
  /** Called when a file is removed */
  onFileRemove?: (fileId: string) => void
  /** Visual variant */
  variant?: FileUploadVariant
  /** Disable interactions */
  disabled?: boolean
  /** Custom style */
  style?: ViewStyle
}

/**
 * FileUploadItem component props
 */
export interface FileUploadItemProps {
  /** File to display */
  file: UploadedFile
  /** Called when remove button is pressed */
  onRemove?: () => void
  /** Visual variant */
  variant?: FileUploadVariant
  /** Disable interactions */
  disabled?: boolean
  /** Custom style */
  style?: ViewStyle
}

/**
 * FileUploadProgress component props
 */
export interface FileUploadProgressProps {
  /** Progress value (0-100) */
  progress: number
  /** Progress bar color */
  color?: string
  /** Progress bar height */
  height?: number
  /** Custom style */
  style?: ViewStyle
}
