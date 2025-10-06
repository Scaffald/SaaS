import { useState, useCallback } from 'react'
import { YStack, XStack, Text, Button, Spinner } from 'tamagui'
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from '@tamagui/lucide-icons'

export interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  accept?: string
  maxSizeMB?: number
  currentFileName?: string
  disabled?: boolean
  error?: string
}

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg'
const DEFAULT_MAX_SIZE_MB = 5

/**
 * FileUpload Component
 * Cross-platform file upload component with drag & drop support (web only)
 *
 * @param onFileSelect - Callback when file is selected
 * @param onFileRemove - Optional callback when file is removed
 * @param accept - Accepted file types (default: .pdf,.png,.jpg,.jpeg)
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @param currentFileName - Currently uploaded file name
 * @param disabled - Disable file selection
 * @param error - Error message to display
 */
export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  currentFileName,
  disabled = false,
  error,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [localError, setLocalError] = useState<string>()

  const displayError = error || localError

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const acceptedTypes = accept.split(',').map((type) => type.trim())
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`

      if (!acceptedTypes.includes(fileExtension)) {
        return `File type not supported. Accepted types: ${accept}`
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSizeMB) {
        return `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum (${maxSizeMB}MB)`
      }

      return null
    },
    [accept, maxSizeMB]
  )

  const handleFileChange = useCallback(
    async (file: File) => {
      setLocalError(undefined)
      setIsProcessing(true)

      try {
        const validationError = validateFile(file)
        if (validationError) {
          setLocalError(validationError)
          setIsProcessing(false)
          return
        }

        onFileSelect(file)
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Failed to process file')
      } finally {
        setIsProcessing(false)
      }
    },
    [validateFile, onFileSelect]
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileChange(file)
      }
      // Reset input value to allow selecting the same file again
      event.target.value = ''
    },
    [handleFileChange]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileChange(file)
      }
    },
    [disabled, handleFileChange]
  )

  const getFileIcon = useCallback(() => {
    if (!currentFileName) return <Upload size={24} />

    const extension = currentFileName.split('.').pop()?.toLowerCase()
    if (extension === 'pdf') {
      return <FileText size={24} />
    }
    return <ImageIcon size={24} />
  }, [currentFileName])

  return (
    <YStack gap="$2">
      {/* File Upload Area */}
      <YStack
        borderWidth={2}
        borderColor={isDragging ? '$blue8' : displayError ? '$red8' : '$borderColor'}
        borderStyle={isDragging ? 'solid' : 'dashed'}
        rounded="$4"
        p="$4"
        bg={isDragging ? '$blue2' : '$background'}
        opacity={disabled ? 0.5 : 1}
        // @ts-ignore - drag events work on web
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <YStack gap="$3" items="center">
          {/* Icon */}
          <YStack width={48} height={48} items="center" justify="center" rounded="$4" bg="$blue3">
            {isProcessing ? <Spinner size="large" /> : getFileIcon()}
          </YStack>

          {/* Text */}
          <YStack gap="$1" items="center">
            {currentFileName ? (
              <>
                <Text fontWeight="600">{currentFileName}</Text>
                <Text fontSize="$2" color="$color11">
                  File uploaded successfully
                </Text>
              </>
            ) : (
              <>
                <Text fontWeight="600">{isDragging ? 'Drop file here' : 'Upload certificate'}</Text>
                <Text fontSize="$2" color="$color11">
                  Drag & drop or click to browse
                </Text>
              </>
            )}
          </YStack>

          {/* Button */}
          <XStack gap="$2">
            {currentFileName && onFileRemove ? (
              <Button
                size="$3"
                variant="outlined"
                onPress={onFileRemove}
                disabled={disabled}
                icon={X}
              >
                Remove File
              </Button>
            ) : (
              <Button
                size="$3"
                disabled={disabled || isProcessing}
                onPress={() => {
                  document.getElementById('file-upload-input')?.click()
                }}
                icon={Upload}
              >
                {isProcessing ? 'Processing...' : 'Choose File'}
              </Button>
            )}
          </XStack>

          {/* File Type Info */}
          <Text fontSize="$1" color="$color10">
            Supported: {accept} (Max {maxSizeMB}MB)
          </Text>
        </YStack>

        {/* Hidden File Input */}
        <input
          id="file-upload-input"
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </YStack>

      {/* Error Message */}
      {displayError && (
        <XStack gap="$2" items="center" p="$2" bg="$red2" rounded="$3">
          <AlertCircle size={16} color="$red10" />
          <Text fontSize="$2" color="$red10">
            {displayError}
          </Text>
        </XStack>
      )}
    </YStack>
  )
}
