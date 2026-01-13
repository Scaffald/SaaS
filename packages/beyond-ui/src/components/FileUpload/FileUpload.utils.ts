/**
 * FileUpload utility functions
 * Helper functions for file validation, formatting, and icon selection
 */

import {
  File as FileIcon,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react-native'
import type { UploadedFile } from './FileUpload.types'

/**
 * Validates a file against type and size restrictions
 * @param file - File to validate
 * @param accept - Accepted file types (e.g., "image/*,application/pdf")
 * @param maxSize - Maximum file size in bytes
 * @returns Error message if validation fails, null if valid
 */
export function validateFile(file: File, accept?: string, maxSize?: number): string | null {
  // Check file size
  if (maxSize && file.size > maxSize) {
    return `File size exceeds maximum of ${formatFileSize(maxSize)}`
  }

  // Check file type
  if (accept) {
    const acceptedTypes = accept.split(',').map((t) => t.trim())
    const fileType = file.type
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase() || ''}`

    const isAccepted = acceptedTypes.some((type) => {
      // Extension match (e.g., ".pdf")
      if (type.startsWith('.')) {
        return fileExt === type.toLowerCase()
      }
      // Wildcard match (e.g., "image/*")
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '')
        return fileType.startsWith(baseType)
      }
      // Exact MIME type match (e.g., "application/pdf")
      return fileType === type
    })

    if (!isAccepted) {
      return `File type not accepted. Allowed: ${accept}`
    }
  }

  return null
}

/**
 * Formats file size from bytes to human-readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

/**
 * Gets the appropriate Lucide icon component for a file type
 * @param fileType - MIME type or file extension
 * @returns Lucide icon component
 */
export function getFileIcon(
  fileType: string
): React.ComponentType<{ size: number; color: string }> {
  const type = fileType.toLowerCase()

  // Image files
  if (type.startsWith('image/')) {
    return FileImage
  }

  // Video files
  if (type.startsWith('video/')) {
    return FileVideo
  }

  // Audio files
  if (type.startsWith('audio/')) {
    return FileAudio
  }

  // Document files
  if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('word') ||
    type.includes('text')
  ) {
    return FileText
  }

  // Spreadsheet files
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) {
    return FileSpreadsheet
  }

  // Archive files
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    type.includes('7z') ||
    type.includes('tar') ||
    type.includes('gz')
  ) {
    return FileArchive
  }

  // Code files
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('css') ||
    type.includes('xml')
  ) {
    return FileCode
  }

  // Default file icon
  return FileIcon
}

/**
 * Generates a unique ID for an uploaded file
 * @returns Unique file ID string
 */
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Converts a File object to an UploadedFile object
 * @param file - File object to convert
 * @returns UploadedFile object
 */
export function fileToUploadedFile(file: File): UploadedFile {
  return {
    id: generateFileId(),
    name: file.name,
    size: file.size,
    type: file.type,
    file: file,
    status: 'pending',
    progress: 0,
  }
}

/**
 * Checks if a file type is an image
 * @param fileType - MIME type to check
 * @returns True if the file is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.toLowerCase().startsWith('image/')
}

/**
 * Gets a file extension from a filename
 * @param filename - File name with extension
 * @returns File extension (e.g., ".pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  if (parts.length === 1) return ''
  return `.${parts.pop()?.toLowerCase() || ''}`
}
