/**
 * FileUpload - File upload component using Beyond UI
 * REQ-166: Task Management Workflow & UI
 */
import type React from 'react'
import { useState, useRef } from 'react'
import { Stack, Text } from '@unicornlove/beyond-ui'
import { Upload, CloudUpload } from 'lucide-react'

interface FileUploadProps {
  taskId: string
  onUpload: (file: File) => Promise<void>
  maxSizeMB?: number
  acceptedTypes?: string[]
}

const getUploadZoneStyle = (dragging: boolean, uploading: boolean): React.CSSProperties => ({
  borderWidth: '2px',
  borderStyle: 'dashed',
  borderRadius: '8px',
  padding: '32px',
  cursor: uploading ? 'default' : 'pointer',
  borderColor: dragging ? 'var(--color-blue9)' : 'var(--color-border)',
  backgroundColor: dragging ? 'var(--color-blue2)' : 'transparent',
  pointerEvents: uploading ? 'none' : 'auto',
  opacity: uploading ? 0.5 : 1,
  textAlign: 'center' as const,
})

export const FileUpload: React.FC<FileUploadProps> = ({
  taskId: _taskId,
  onUpload,
  maxSizeMB = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'],
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!acceptedTypes.includes(extension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const handleFile = async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setUploading(true)
      setProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      await onUpload(file)

      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <Stack style={{ gap: '8px' }}>
      <div
        style={getUploadZoneStyle(isDragging, uploading)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <Stack style={{ gap: '16px', alignItems: 'center' }}>
            <CloudUpload size={48} color="currentColor" />
            <Stack style={{ gap: '8px', width: '100%' }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color11)' }}>
                Uploading...
              </Text>
              <div
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-color4)',
                  borderRadius: '9999px',
                  height: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'var(--color-blue9)',
                    borderRadius: '9999px',
                    transition: 'width 300ms',
                    width: `${progress}%`,
                  }}
                />
              </div>
              <Text style={{ fontSize: '12px', color: 'var(--color-color9)', marginTop: '4px' }}>
                {progress}%
              </Text>
            </Stack>
          </Stack>
        ) : (
          <Stack style={{ gap: '8px', alignItems: 'center' }}>
            <Upload size={48} color="currentColor" />
            <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-color11)', marginTop: '8px' }}>
              Drag and drop your file here, or click to browse
            </Text>
            <Text style={{ fontSize: '12px', color: 'var(--color-color9)', marginTop: '4px' }}>
              Max file size: {maxSizeMB}MB. Accepted types: {acceptedTypes.join(', ')}
            </Text>
          </Stack>
        )}
      </div>

      {error && (
        <Stack
          style={{
            marginTop: '8px',
            padding: '12px',
            backgroundColor: 'var(--color-red2)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--color-red6)',
            borderRadius: '8px',
          }}
        >
          <Text style={{ fontSize: '14px', color: 'var(--color-red11)' }}>
            {error}
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
