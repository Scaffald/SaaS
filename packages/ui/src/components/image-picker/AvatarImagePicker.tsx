import { Camera, User, Delete, Edit3 } from '@tamagui/lucide-icons'
import { useEffect, useId, useState } from 'react'
import { Button, Circle, Image, Label, Text, View, XStack, YStack } from 'tamagui'

import type { AvatarImagePickerProps } from './types'
import { useFilePicker } from './hooks/useFilePicker'
import { MediaTypeOptions } from './types'
import { AvatarCropModal } from './AvatarCropModal'

/**
 * Avatar Image Picker Component
 *
 * A cross-platform image picker specifically designed for avatar uploads.
 * Supports drag & drop on web and native image picker on mobile.
 *
 * @param value - Current avatar image URI
 * @param onImageSelect - Callback when image is selected
 * @param size - Size of the avatar picker (default: 120)
 * @param disabled - Whether the picker is disabled
 * @param placeholder - Placeholder text when no image is selected
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

  const { open, getInputProps, getRootProps, dragStatus } = useFilePicker({
    typeOfPicker: 'image',
    mediaTypes: [MediaTypeOptions.Images],
    multiple: false,

    onPick: async ({ webFiles, nativeFiles }) => {
      setIsLoading(true)
      try {
        if (webFiles?.length) {
          const imageUri = URL.createObjectURL(webFiles[0])
          setSelectedImageUri(imageUri)
          setCropModalOpen(true)
          setShouldRevokeUri(true)
        } else if (nativeFiles?.length) {
          const imageUri = nativeFiles[0].uri
          setSelectedImageUri(imageUri)
          setCropModalOpen(true)
          setShouldRevokeUri(false)
        }
      } catch (error) {
        console.error('Error selecting image:', error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  useEffect(() => {
    return () => {
      if (shouldRevokeUri && selectedImageUri.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImageUri)
      }
    }
  }, [selectedImageUri, shouldRevokeUri])

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

  const { isDragActive } = dragStatus || {}

  return (
    <YStack items="center" gap="$3">
      {/* Avatar Circle */}
      <View
        // @ts-ignore reason: getRootProps() which is web specific return some react-native incompatible props, but it's fine
        {...(getRootProps ? getRootProps() : {})}
        position="relative"
      >
        {/* Hidden input for web */}
        {/* @ts-ignore */}
        <View
          id={id}
          tag="input"
          width={0}
          height={0}
          {...(getInputProps ? getInputProps() : {})}
        />

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
          accessibilityRole="image"
          accessibilityLabel={previewUri || value ? 'Current avatar preview' : 'Avatar placeholder'}
          aria-label={previewUri || value ? 'Current avatar preview' : 'Avatar placeholder'}
        >
          {value ? (
            <Image
              source={{ uri: previewUri || value }}
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

          {/* Camera overlay when hovering */}
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
            hoverStyle={{
              opacity: disabled ? 0 : 1,
            }}
            style={{ pointerEvents: 'none' }}
          >
            <Camera size={size * 0.25} color="white" />
          </View>
        </Circle>
      </View>

      {/* Action Buttons */}
      <XStack gap="$2" items="center">
        <Button
          size="$3"
          variant="outlined"
          onPress={open}
          disabled={disabled || isLoading || cropModalOpen}
          icon={Camera}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Select a new photo' : 'Select a photo'}
          aria-label={value ? 'Select a new photo' : 'Select a photo'}
        >
          <Button.Text>
            {isLoading ? 'Loading...' : value ? 'Change Photo' : 'Select Photo'}
          </Button.Text>
        </Button>

        {value ? (
          <Button
            size="$3"
            variant="outlined"
            onPress={openEditModal}
            disabled={disabled || isLoading || cropModalOpen}
            icon={Edit3}
            accessibilityRole="button"
            accessibilityLabel="Edit current photo"
            aria-label="Edit current photo"
          >
            <Button.Text>Edit Photo</Button.Text>
          </Button>
        ) : null}

        {value ? (
          <Button
            size="$3"
            variant="outlined"
            color="$red10"
            onPress={() => onImageSelect('')}
            disabled={disabled || isLoading || cropModalOpen}
            icon={Delete}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            aria-label="Remove photo"
          >
            <Button.Text>Remove</Button.Text>
          </Button>
        ) : null}
      </XStack>

      {cropModalOpen && (
        <Text fontSize="$2" color="$color10" aria-live="polite">
          Editing photo...
        </Text>
      )}

      {/* Web-only drag instruction */}
      <Label
        $platform-native={{
          display: 'none',
        }}
        size="$2"
        color="$color9"
        text="center"
        display={disabled ? 'none' : 'flex'}
      >
        <Text>Drag & drop an image or click to select</Text>
      </Label>

      {/* Crop Modal */}
      {selectedImageUri ? (
        <AvatarCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageUri={selectedImageUri}
          onCropComplete={handleCropComplete}
          cropSize={size * 2}
          onError={handleCropError}
        />
      ) : null}
    </YStack>
  )
}
