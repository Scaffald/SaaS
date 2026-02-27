/**
 * AvatarCropModal – confirm/cancel step for selected image.
 * Minimal implementation: no crop UI; confirms the selected image and passes it as data URL when possible.
 */

import { useEffect, useState } from 'react'
import { View, Image, Text, Platform } from 'react-native'
import { Modal, ModalHeader, ModalContent, ModalActions } from '../Modal'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { AvatarCropModalProps } from './ImagePicker.types'

function uriToDataUrl(uri: string): Promise<string> {
  if (uri.startsWith('data:')) return Promise.resolve(uri)
  if (Platform.OS === 'web' && (uri.startsWith('blob:') || uri.startsWith('http'))) {
    return fetch(uri)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader()
            r.onload = () => res(r.result as string)
            r.onerror = rej
            r.readAsDataURL(blob)
          })
      )
  }
  return Promise.resolve(uri)
}

export function AvatarCropModal({
  open,
  onOpenChange,
  imageUri,
  onCropComplete,
  onError,
}: AvatarCropModalProps) {
  const [loadFailed, setLoadFailed] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!open) {
      setLoadFailed(false)
      setIsProcessing(false)
    }
  }, [open])

  const handleConfirm = async () => {
    if (loadFailed) {
      onError?.('Failed to load image.')
      return
    }
    setIsProcessing(true)
    try {
      const dataUrl = await uriToDataUrl(imageUri)
      onCropComplete(dataUrl)
      onOpenChange(false)
    } catch {
      onError?.('Failed to process image.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal visible={open} onClose={() => onOpenChange(false)} width={400}>
      <ModalHeader
        title="Crop photo"
        onClose={() => onOpenChange(false)}
        showCloseButton
      />
      <ModalContent>
        <View
          style={{
            minHeight: 280,
            backgroundColor: colors.gray[100],
            borderRadius: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadFailed ? (
            <Text style={{ color: colors.text.light.secondary, padding: spacing[4] }}>
              Failed to load image
            </Text>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 280, height: 280, borderRadius: 8 }}
              resizeMode="cover"
              onError={() => setLoadFailed(true)}
            />
          )}
        </View>
      </ModalContent>
      <ModalActions
        primaryAction={{
          label: 'Use photo',
          onPress: handleConfirm,
          disabled: loadFailed || isProcessing,
          loading: isProcessing,
        }}
        secondaryAction={{ label: 'Cancel', onPress: () => onOpenChange(false), disabled: isProcessing }}
      />
    </Modal>
  )
}
