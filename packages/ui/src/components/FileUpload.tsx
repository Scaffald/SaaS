import { AlertCircle, Upload, X } from '@tamagui/lucide-icons'
import { type MouseEvent, type ReactNode, useId, useMemo, useState } from 'react'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'
import type { UploadSelection } from './upload/UploadSurface'
import { UploadSurface } from './upload/UploadSurface'

export interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  accept?: string
  maxSizeMB?: number
  currentFileName?: string
  disabled?: boolean
  error?: string
  icon?: ReactNode
  title?: string
  description?: string
  ctaLabel?: string
  helperText?: string
}

const DEFAULT_ACCEPT = '.pdf,.png,.jpg,.jpeg'
const DEFAULT_MAX_SIZE_MB = 5

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  currentFileName,
  disabled = false,
  error,
  icon,
  title,
  description,
  ctaLabel,
  helperText,
}: FileUploadProps) {
  const [localError, setLocalError] = useState<string>()
  const [selectedFileName, setSelectedFileName] = useState<string>()
  const inputId = useId()

  const displayError = error || localError
  const resolvedTitle = title ?? 'Upload file'
  const resolvedDescription = description ?? 'Drag & drop or use the button to browse'
  const resolvedCta = ctaLabel ?? 'Choose File'
  const resolvedIcon = icon ?? <Upload size={24} />
  const resolvedHelper = helperText ?? `Supported: ${accept} (Max ${maxSizeMB.toFixed(1)}MB)`

  const fileNameToShow = currentFileName ?? selectedFileName ?? ''

  const maxSizeBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB])

  const handleSelection = async (selection: UploadSelection) => {
    console.debug('[FileUpload] handleSelection', selection)
    if (selection.platform !== 'web') {
      setLocalError('Native file uploads are not supported in this context.')
      return
    }

    setLocalError(undefined)
    setSelectedFileName(selection.file.name)
    onFileSelect(selection.file)
  }

  const handleRemove = () => {
    setSelectedFileName(undefined)
    onFileRemove?.()
  }

  return (
    <UploadSurface
      accept={accept}
      maxSizeBytes={maxSizeBytes}
      disabled={disabled}
      onError={(message) => setLocalError(message)}
      onSelect={handleSelection}
    >
      {({ getRootProps, getInputProps, open, isDragActive, isProcessing }) => (
        <YStack gap="$2">
          <YStack
            borderWidth={2}
            borderColor={isDragActive ? '$blue8' : displayError ? '$red8' : '$borderColor'}
            borderStyle={isDragActive ? 'solid' : 'dashed'}
            rounded="$4"
            p="$4"
            bg={isDragActive ? '$blue2' : '$background'}
            opacity={disabled ? 0.5 : 1}
            {...(getRootProps({
              onClick: (event: MouseEvent) => event.preventDefault(),
            }) as Record<string, unknown>)}
          >
            <input
              id={inputId}
              style={{ display: 'none' }}
              {...(getInputProps({
                accept,
                disabled,
              }) as Record<string, unknown>)}
            />

            <YStack gap="$3" items="center">
              <YStack
                width={48}
                height={48}
                items="center"
                justify="center"
                rounded="$4"
                bg="$blue3"
              >
                {isProcessing ? <Spinner size="large" /> : resolvedIcon}
              </YStack>

              <YStack gap="$1" items="center">
                <Text fontWeight="600">
                  {fileNameToShow
                    ? fileNameToShow
                    : isDragActive
                      ? 'Drop file here'
                      : resolvedTitle}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {fileNameToShow ? 'File ready for upload' : resolvedDescription}
                </Text>
              </YStack>

              <XStack gap="$2">
                {fileNameToShow && onFileRemove ? (
                  <Button
                    size="$3"
                    variant="outlined"
                    onPress={handleRemove}
                    disabled={disabled || isProcessing}
                    icon={X}
                  >
                    Remove File
                  </Button>
                ) : (
                  <Button
                    size="$3"
                    disabled={disabled || isProcessing}
                    onPress={() => {
                      if (disabled) return
                      open()
                    }}
                    icon={Upload}
                  >
                    {isProcessing ? 'Processing...' : resolvedCta}
                  </Button>
                )}
              </XStack>

              <Text fontSize="$1" color="$color10">
                {resolvedHelper}
              </Text>
            </YStack>
          </YStack>

          {displayError && (
            <XStack gap="$2" items="center" p="$2" bg="$red2" rounded="$3">
              <AlertCircle size={16} color="$red10" />
              <Text fontSize="$2" color="$red10">
                {displayError}
              </Text>
            </XStack>
          )}
        </YStack>
      )}
    </UploadSurface>
  )
}
