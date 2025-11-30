import { Camera, Delete, Edit3, User } from '@tamagui/lucide-icons'
import { useEffect, useId, useState } from 'react'
import { Platform } from 'react-native'
import { Button, Circle, Image, Label, Spinner, Text, View, XStack, YStack } from 'tamagui'
import type { UploadSelection } from '../upload/UploadSurface'
import { UploadSurface } from '../upload/UploadSurface'
import { AvatarCropModal } from './AvatarCropModal'
import type { AvatarImagePickerProps } from './types'

/**
 * Avatar Image Picker Component
 *
 * A cross-platform image picker specifically designed for avatar uploads.
 * Supports drag & drop on web and native image picker on mobile.
 */
export function AvatarImagePicker({
  value,
  onImageSelect,
  onCropError,
  size = 120,
  disabled = false,
  placeholder = 'Add Photo',
}: AvatarImagePickerProps) {
  const id = useId()
  const [isLoading, setIsLoading] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUri, setSelectedImageUri] = useState<string>('')
  const [shouldRevokeUri, setShouldRevokeUri] = useState(false)
  const [previewUri, setPreviewUri] = useState(value ?? '')

  useEffect(() => {
    if (!cropModalOpen) {
      setPreviewUri(value ?? '')
    }
  }, [value, cropModalOpen])

  useEffect(() => {
    return () => {
      if (shouldRevokeUri && selectedImageUri.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImageUri)
      }
    }
  }, [selectedImageUri, shouldRevokeUri])

  const handleUploadSelection = async (selection: UploadSelection) => {
    setIsLoading(true)
    try {
      if (selection.platform === 'web') {
        const imageUri = URL.createObjectURL(selection.file)
        setSelectedImageUri(imageUri)
        setShouldRevokeUri(true)
        setCropModalOpen(true)
      } else {
        const imageUri = selection.asset.uri
        setSelectedImageUri(imageUri)
        setShouldRevokeUri(false)
        setCropModalOpen(true)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      onCropError?.('Failed to load selected image.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCropComplete = (croppedImageDataUrl: string) => {
    onImageSelect(croppedImageDataUrl)
    setPreviewUri(croppedImageDataUrl)
    if (shouldRevokeUri && selectedImageUri.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImageUri)
    }
    setCropModalOpen(false)
    setSelectedImageUri('')
    setShouldRevokeUri(false)
  }

  const handleCropError = (message: string) => {
    console.error('Avatar crop error:', message)
    if (shouldRevokeUri && selectedImageUri.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImageUri)
    }
    onCropError?.(message)
    setCropModalOpen(false)
    setSelectedImageUri('')
    setShouldRevokeUri(false)
  }

  const openEditModal = () => {
    if (!value) return
    setSelectedImageUri(value)
    setShouldRevokeUri(false)
    setCropModalOpen(true)
  }

  return (
    <UploadSurface
      accept=".png,.jpg,.jpeg,.webp"
      disabled={disabled}
      dropzoneOptions={{ noClick: false }}
      onError={(message) => onCropError?.(message)}
      onSelect={handleUploadSelection}
    >
      {({ getRootProps, getInputProps, open, isDragActive, isProcessing }) => {
        const isBusy = isLoading || isProcessing

        return (
          <YStack items="center" gap="$3">
            <View
              {...(getRootProps({
                style: { position: 'relative' },
              }) as Record<string, unknown>)}
            >
              {/* Hidden input for web */}
              {Platform.OS === 'web' && (
                <View
                  id={id}
                  tag="input"
                  width={0}
                  height={0}
                  {...(getInputProps({ accept: 'image/*' }) as Record<string, unknown>)}
                />
              )}

              <Circle
                size={size}
                bg={isDragActive ? '$blue3' : '$color3'}
                borderColor={isDragActive ? '$blue8' : '$color6'}
                borderWidth={2}
                borderStyle={isDragActive ? 'solid' : 'dashed'}
                overflow="hidden"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                opacity={disabled ? 0.5 : 1}
                pressStyle={{
                  scale: disabled ? 1 : 0.98,
                }}
                hoverStyle={{
                  borderColor: disabled ? '$color6' : '$blue8',
                  bg: disabled ? '$color3' : '$blue2',
                }}
                aria-role="image"
                aria-label={previewUri || value ? 'Current avatar preview' : 'Avatar placeholder'}
              >
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    width={size}
                    height={size}
                    rounded={size / 2}
                  />
                ) : (
                  <YStack items="center" justify="center" flex={1} gap="$2">
                    <User size={size * 0.3} color="$color9" />
                    <Text
                      fontSize="$2"
                      color="$color9"
                      text="center"
                      display={size < 80 ? 'none' : 'flex'}
                    >
                      {isDragActive ? 'Drop here' : placeholder}
                    </Text>
                  </YStack>
                )}

                {isBusy && !previewUri && (
                  <YStack
                    position="absolute"
                    t={0}
                    l={0}
                    r={0}
                    b={0}
                    items="center"
                    justify="center"
                    bg="rgba(0,0,0,0.35)"
                  >
                    <Spinner color="white" size="large" />
                  </YStack>
                )}

                <View
                  position="absolute"
                  t={0}
                  l={0}
                  r={0}
                  b={0}
                  bg="$color9"
                  rounded={size / 2}
                  items="center"
                  justify="center"
                  opacity={0}
                  hoverStyle={{ opacity: disabled ? 0 : 1 }}
                  style={{ pointerEvents: 'none' }}
                >
                  <Camera size={size * 0.25} color="white" />
                </View>
              </Circle>
            </View>

            <XStack gap="$2" items="center">
              <Button
                size="$3"
                variant="outlined"
                onPress={open}
                disabled={disabled || isBusy || cropModalOpen}
                icon={Camera}
                aria-role="button"
                aria-label={value ? 'Select a new photo' : 'Select a photo'}
              >
                <Button.Text>
                  {value ? 'Change Photo' : isBusy || cropModalOpen ? 'Opening...' : placeholder}
                </Button.Text>
              </Button>
              {value ? (
                <>
                  <Button
                    size="$3"
                    variant="outlined"
                    icon={Edit3}
                    onPress={openEditModal}
                    disabled={disabled || isBusy}
                  >
                    Edit
                  </Button>
                  <Button
                    size="$3"
                    variant="outlined"
                    icon={Delete}
                    onPress={() => onImageSelect('')}
                    disabled={disabled || isBusy}
                  >
                    Remove
                  </Button>
                </>
              ) : null}
            </XStack>

            <Label htmlFor={id}>{placeholder}</Label>

            <AvatarCropModal
              open={cropModalOpen}
              onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                  if (shouldRevokeUri && selectedImageUri.startsWith('blob:')) {
                    URL.revokeObjectURL(selectedImageUri)
                  }
                  setSelectedImageUri('')
                  setShouldRevokeUri(false)
                }
                setCropModalOpen(nextOpen)
              }}
              imageUri={selectedImageUri}
              onCropComplete={handleCropComplete}
              onError={handleCropError}
            />
          </YStack>
        )
      }}
    </UploadSurface>
  )
}
