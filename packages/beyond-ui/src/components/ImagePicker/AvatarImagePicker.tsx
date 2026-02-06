/**
 * AvatarImagePicker – circle avatar with upload (web: file input + drop; native: optional onOpenNative).
 */

import { useCallback, useEffect, useState } from 'react'
import { View, Text, Image, Pressable, Platform } from 'react-native'
import { Camera, Edit3, Trash2 } from 'lucide-react-native'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Button } from '../Button'
import { AvatarCropModal } from './AvatarCropModal'
import { useFilePicker } from './useFilePicker'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { AvatarImagePickerProps } from './ImagePicker.types'

export function AvatarImagePicker({
  value = '',
  onImageSelect,
  onCropError,
  size = 120,
  disabled = false,
  placeholder = 'Add Photo',
}: AvatarImagePickerProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageUri, setSelectedImageUri] = useState('')
  const [shouldRevokeUri, setShouldRevokeUri] = useState(false)
  const [previewUri, setPreviewUri] = useState(value ?? '')

  useEffect(() => {
    if (!cropModalOpen) {
      setPreviewUri(value ?? '')
    }
  }, [value, cropModalOpen])

  useEffect(() => {
    return () => {
      if (shouldRevokeUri && selectedImageUri.startsWith('blob:') && Platform.OS === 'web') {
        try {
          URL.revokeObjectURL(selectedImageUri)
        } catch {
          // ignore
        }
      }
    }
  }, [selectedImageUri, shouldRevokeUri])

  const handlePick = useCallback(
    (param: { webFiles: File[] | null; nativeFiles: Array<{ uri: string }> | null }) => {
      if (param.webFiles?.[0]) {
        const file = param.webFiles[0]
        const uri = URL.createObjectURL(file)
        setSelectedImageUri(uri)
        setShouldRevokeUri(true)
        setCropModalOpen(true)
      } else if (param.nativeFiles?.[0]) {
        setSelectedImageUri(param.nativeFiles[0].uri)
        setShouldRevokeUri(false)
        setCropModalOpen(true)
      }
    },
    []
  )

  const { open, getInputProps, getRootProps } = useFilePicker({
    onPick: handlePick,
  })

  const handleCropComplete = (dataUrl: string) => {
    onImageSelect(dataUrl)
    setPreviewUri(dataUrl)
    if (shouldRevokeUri && selectedImageUri.startsWith('blob:') && Platform.OS === 'web') {
      try {
        URL.revokeObjectURL(selectedImageUri)
      } catch {
        // ignore
      }
    }
    setCropModalOpen(false)
    setSelectedImageUri('')
    setShouldRevokeUri(false)
  }

  const handleCropError = (message: string) => {
    onCropError?.(message)
    if (shouldRevokeUri && selectedImageUri.startsWith('blob:') && Platform.OS === 'web') {
      try {
        URL.revokeObjectURL(selectedImageUri)
      } catch {
        // ignore
      }
    }
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

  const isWeb = Platform.OS === 'web'
  const rootProps = getRootProps() as { onPress?: () => void; onClick?: (e: { preventDefault: () => void }) => void }
  const inputProps = getInputProps() as Record<string, unknown>

  return (
    <Stack gap={spacing[3]} style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative' }}>
        {isWeb && typeof document !== 'undefined' && (
          <input
            ref={(el) => {
              const refSetter = (inputProps as { ref?: (el: HTMLInputElement | null) => void }).ref
              if (typeof refSetter === 'function') refSetter(el)
            }}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const onChange = (inputProps as { onChange?: (e: { target?: { files?: File[]; value?: string } }) => void }).onChange
              onChange?.(e as unknown as { target?: { files?: File[]; value?: string } })
            }}
          />
        )}
        <Pressable
          onPress={rootProps.onPress}
          style={({ pressed }) => [
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.gray[100],
              borderWidth: 2,
              borderColor: colors.gray[300],
              borderStyle: 'dashed',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.5 : 1,
            },
            pressed && !disabled && { opacity: 0.9 },
          ]}
          {...(isWeb && {
            onClick: rootProps.onClick,
            onDragOver: (e: unknown) => (e as { preventDefault: () => void }).preventDefault(),
            onDrop: (e: unknown) => (e as { preventDefault: () => void }).preventDefault(),
          })}
        >
          {previewUri ? (
            <Image
              source={{ uri: previewUri }}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              resizeMode="cover"
            />
          ) : (
            <Stack gap={spacing[2]} style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={size * 0.3} color={colors.gray[500]} />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text.light.secondary,
                  textAlign: 'center',
                  display: size < 80 ? 'none' : 'flex',
                }}
              >
                {placeholder}
              </Text>
            </Stack>
          )}
        </Pressable>
      </View>
      <Row gap={spacing[2]} align="center">
        <Button
          size="md"
          variant="outline"
          color="gray"
          onPress={open}
          disabled={disabled || cropModalOpen}
          iconStart={Camera}
        >
          {value ? 'Change Photo' : placeholder}
        </Button>
        {value ? (
          <>
            <Button
              size="md"
              variant="outline"
              color="gray"
              iconStart={Edit3}
              onPress={openEditModal}
              disabled={disabled}
            >
              Edit
            </Button>
            <Button
              size="md"
              variant="outline"
              color="gray"
              iconStart={Trash2}
              onPress={() => onImageSelect('')}
              disabled={disabled}
            >
              Remove
            </Button>
          </>
        ) : null}
      </Row>
      <AvatarCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageUri={selectedImageUri}
        onCropComplete={handleCropComplete}
        onError={handleCropError}
      />
    </Stack>
  )
}
