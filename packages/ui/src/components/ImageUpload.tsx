import { supabase } from '@app/core/utils/supabase/client'
import { getStorageUrl } from '@app/core/utils/supabase/storage'
import { AlertCircle, Image as ImageIcon, Trash2, Upload } from '@tamagui/lucide-icons'
import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { Button, Image, Spinner, Text, XStack, YStack } from 'tamagui'
import { useFilePicker } from './image-picker/hooks/useFilePicker'
import { MediaTypeOptions } from './image-picker/types'

export interface ImageUploadProps {
  /** Current image URL (for edit mode) */
  value?: string
  /** Callback when image is uploaded or removed */
  onChange: (url: string | null) => void
  /** Callback for error handling */
  onError?: (error: string) => void
  /** Storage bucket name (default: 'cms-media') */
  bucket?: string
  /** Path prefix for organization (e.g., 'welcome-slides/{id}') */
  pathPrefix?: string
  /** Maximum file size in MB (default: 5) */
  maxSizeMB?: number
  /** Accepted file types (default: images) */
  accept?: string
  /** Whether the upload is disabled */
  disabled?: boolean
  /** Label text */
  label?: string
  /** Helper text */
  helperText?: string
}

const DEFAULT_BUCKET = 'cms-media'
const DEFAULT_MAX_SIZE_MB = 5
const DEFAULT_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif'

/**
 * ImageUpload Component
 *
 * A reusable image upload component that integrates with Supabase storage.
 * Supports drag & drop on web and native file picker on mobile.
 *
 * @param value - Current image URL
 * @param onChange - Callback with uploaded URL or null if removed
 * @param onError - Error callback
 * @param bucket - Storage bucket name (default: 'cms-media')
 * @param pathPrefix - Path prefix for organization
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @param accept - Accepted file types (default: images)
 * @param disabled - Disable upload
 * @param label - Label text
 * @param helperText - Helper text
 */
export function ImageUpload({
  value,
  onChange,
  onError,
  bucket = DEFAULT_BUCKET,
  pathPrefix,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  accept = DEFAULT_ACCEPT,
  disabled = false,
  label,
  helperText,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string>()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useRef(`image-upload-input-${Math.random().toString(36).substring(2, 9)}`)

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const acceptedTypes = accept.split(',').map((type) => type.trim())
      const fileType = file.type.toLowerCase()

      if (!acceptedTypes.some((type) => fileType.includes(type.split('/')[1] || ''))) {
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

  const generateFilePath = useCallback(
    (fileName: string): string => {
      // Extract extension
      const extension = fileName.split('.').pop() || 'jpg'
      // Generate unique filename with timestamp
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`

      if (pathPrefix) {
        return `${pathPrefix}/${uniqueFileName}`
      }
      return uniqueFileName
    },
    [pathPrefix]
  )

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError(undefined)
      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          onError?.(validationError)
          setIsUploading(false)
          return
        }

        // Generate file path
        const filePath = generateFilePath(file.name)

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const fileBlob = new Blob([arrayBuffer], { type: file.type })

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileBlob, {
            contentType: file.type,
            upsert: true, // Replace if exists
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // Get public URL
        const publicUrl = getStorageUrl(bucket, uploadData.path)

        if (!publicUrl) {
          throw new Error('Failed to get public URL for uploaded image')
        }

        // Call onChange with the public URL
        onChange(publicUrl)
        setUploadProgress(100)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
        setError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setIsUploading(false)
        // Reset progress after a short delay
        setTimeout(() => setUploadProgress(0), 500)
      }
    },
    [bucket, generateFilePath, onChange, onError, validateFile]
  )

  // Handle file input change (web only)
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = ''
      }
    },
    [handleFileUpload]
  )

  const handleDelete = useCallback(async () => {
    if (!value) return

    setError(undefined)
    setIsUploading(true)

    try {
      // Extract path from URL if it's a full URL
      let filePath: string
      if (value.startsWith('http://') || value.startsWith('https://')) {
        // Extract path from URL: /storage/v1/object/public/{bucket}/{path}
        const urlParts = value.split(`/storage/v1/object/public/${bucket}/`)
        if (urlParts.length === 2) {
          filePath = urlParts[1]
        } else {
          // If we can't extract path, just clear the value
          onChange(null)
          setIsUploading(false)
          return
        }
      } else {
        filePath = value
      }

      // Delete from storage
      const { error: deleteError } = await supabase.storage.from(bucket).remove([filePath])

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`)
      }

      // Clear the value
      onChange(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [bucket, onChange, onError, value])

  const { open, getInputProps, getRootProps, dragStatus } = useFilePicker({
    typeOfPicker: 'image',
    mediaTypes: [MediaTypeOptions.Images],
    multiple: false,
    onPick: async ({ webFiles, nativeFiles }) => {
      if (webFiles?.length) {
        await handleFileUpload(webFiles[0])
      } else if (nativeFiles?.length) {
        // For native, convert URI to File/Blob for Supabase upload
        const nativeFile = nativeFiles[0]
        if ('uri' in nativeFile && nativeFile.uri) {
          try {
            // Fetch the file from the URI
            const response = await fetch(nativeFile.uri)
            const blob = await response.blob()

            // Determine file type from native file or blob
            const fileType = nativeFile.type || blob.type || 'image/jpeg'
            const extension = fileType.split('/').pop() || 'jpg'
            const fileName = `image-${Date.now()}.${extension}`

            // Create a File-like object for validation and upload
            // On web, we can use File constructor; on native, we'll use the blob directly
            let fileToUpload: File | Blob
            if (typeof File !== 'undefined') {
              fileToUpload = new File([blob], fileName, { type: fileType })
            } else {
              // For React Native, use blob directly
              fileToUpload = blob
            }

            // Validate file size (blob.size is available)
            const fileSizeMB = blob.size / (1024 * 1024)
            if (fileSizeMB > maxSizeMB) {
              const errorMsg = `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum (${maxSizeMB}MB)`
              setError(errorMsg)
              onError?.(errorMsg)
              return
            }

            // Generate file path
            const filePath = generateFilePath(fileName)

            // Upload to Supabase storage
            setError(undefined)
            setIsUploading(true)
            setUploadProgress(0)

            try {
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileToUpload, {
                  contentType: fileType,
                  upsert: true,
                })

              if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`)
              }

              // Get public URL
              const publicUrl = getStorageUrl(bucket, uploadData.path)

              if (!publicUrl) {
                throw new Error('Failed to get public URL for uploaded image')
              }

              // Call onChange with the public URL
              onChange(publicUrl)
              setUploadProgress(100)
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
              setError(errorMessage)
              onError?.(errorMessage)
            } finally {
              setIsUploading(false)
              setTimeout(() => setUploadProgress(0), 500)
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process image'
            setError(errorMessage)
            onError?.(errorMessage)
          }
        }
      }
    },
  })

  // Trigger file picker (defined after useFilePicker so open is available)
  const triggerFilePicker = useCallback(() => {
    if (Platform.OS === 'web') {
      // On web, trigger the hidden file input
      fileInputRef.current?.click()
    } else {
      // On native, use the file picker hook
      open()
    }
  }, [open])

  const { isDragActive } = dragStatus || {}

  // Determine if we have an image (either uploaded or existing)
  const hasImage = !!value

  return (
    <YStack gap="$2">
      {label && (
        <Text fontSize="$4" fontWeight="600">
          {label}
        </Text>
      )}

      {/* Upload Area */}
      <YStack
        borderWidth={2}
        borderColor={
          isDragActive ? '$blue8' : error ? '$red8' : hasImage ? '$borderColor' : '$borderColor'
        }
        borderStyle={isDragActive ? 'solid' : 'dashed'}
        rounded="$4"
        p="$4"
        bg={isDragActive ? '$blue2' : hasImage ? '$background' : '$background'}
        opacity={disabled ? 0.5 : 1}
        {...(Platform.OS === 'web' && getRootProps
          ? (getRootProps() as Record<string, unknown>)
          : {})}
      >
        {hasImage ? (
          // Image Preview Mode
          <YStack gap="$3" items="center">
            <YStack position="relative">
              <Image
                source={{ uri: value }}
                width={200}
                height={200}
                resizeMode="contain"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              />
              {isUploading && (
                <YStack
                  position="absolute"
                  bg="$background"
                  opacity={0.8}
                  items="center"
                  justify="center"
                  rounded="$4"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  <Spinner size="large" />
                </YStack>
              )}
            </YStack>

            <XStack gap="$2">
              <Button
                size="$3"
                variant="outlined"
                onPress={triggerFilePicker}
                disabled={disabled || isUploading}
                icon={Upload}
              >
                Change Image
              </Button>
              <Button
                size="$3"
                variant="outlined"
                color="$red10"
                onPress={handleDelete}
                disabled={disabled || isUploading}
                icon={Trash2}
              >
                Remove
              </Button>
            </XStack>
          </YStack>
        ) : (
          // Upload Mode
          <YStack gap="$3" items="center">
            {/* Icon */}
            <YStack width={64} height={64} items="center" justify="center" rounded="$4" bg="$blue3">
              {isUploading ? <Spinner size="large" /> : <ImageIcon size={32} color="$blue10" />}
            </YStack>

            {/* Text */}
            <YStack gap="$1" items="center">
              <Text fontWeight="600" fontSize="$5">
                {isDragActive ? 'Drop image here' : 'Upload Image'}
              </Text>
              <Text fontSize="$2" color="$color11" style={{ textAlign: 'center' }}>
                {isUploading
                  ? `Uploading... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}`
                  : 'Drag & drop or click to browse'}
              </Text>
            </YStack>

            {/* Button */}
            <Button
              size="$3"
              disabled={disabled || isUploading}
              onPress={triggerFilePicker}
              icon={Upload}
            >
              {isUploading ? 'Uploading...' : 'Choose Image'}
            </Button>

            {/* File Type Info */}
            <Text fontSize="$1" color="$color10" style={{ textAlign: 'center' }}>
              Supported: {accept.replace(/image\//g, '').replace(/,/g, ', ')} (Max {maxSizeMB}MB)
            </Text>
          </YStack>
        )}

        {/* Hidden File Input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            id={fileInputId.current}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            style={{ display: 'none' }}
            disabled={disabled || isUploading}
          />
        )}
      </YStack>

      {/* Helper Text */}
      {helperText && !error && (
        <Text fontSize="$2" color="$color10">
          {helperText}
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <XStack gap="$2" items="center" p="$2" bg="$red2" rounded="$3">
          <AlertCircle size={16} color="$red10" />
          <Text fontSize="$2" color="$red10" flex={1}>
            {error}
          </Text>
        </XStack>
      )}
    </YStack>
  )
}
