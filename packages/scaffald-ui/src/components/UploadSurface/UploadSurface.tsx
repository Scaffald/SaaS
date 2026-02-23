/**
 * UploadSurface component
 * Drag-and-drop file upload zone (web only)
 */

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import type { ReactNode } from 'react'

export interface UploadSelection {
  files: File[]
}

export interface UploadSurfaceProps {
  /** MIME types and extensions to accept (e.g. "application/pdf,image/png,.pdf,.png") */
  accept?: string
  /** Max file size in bytes */
  maxSizeBytes?: number
  /** Disabled state */
  disabled?: boolean
  /** Called when files are selected */
  onSelect: (selection: UploadSelection) => Promise<void>
  /** Called on validation error */
  onError?: (message: string) => void
  /** Render props */
  children: (props: {
    getRootProps: () => Record<string, unknown>
    getInputProps: () => Record<string, unknown>
    open: () => void
    isDragActive: boolean
    isProcessing: boolean
  }) => ReactNode
}

export function UploadSurface({
  accept,
  maxSizeBytes = 10 * 1024 * 1024,
  disabled = false,
  onSelect,
  onError,
  children,
}: UploadSurfaceProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      try {
        await onSelect({ files: acceptedFiles })
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Upload failed')
      }
    },
    [onSelect, onError]
  )

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      const msg = fileRejections[0]?.errors[0]?.message ?? 'File rejected'
      onError?.(msg)
    },
    [onError]
  )

  const acceptMap = accept
    ? {
        'application/pdf': ['.pdf'],
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
      }
    : undefined

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptMap,
    maxSize: maxSizeBytes,
    disabled,
    noClick: false,
    noKeyboard: false,
  })

  return children({
    getRootProps: () => getRootProps(),
    getInputProps: () => getInputProps(),
    open,
    isDragActive,
    isProcessing: false,
  })
}
