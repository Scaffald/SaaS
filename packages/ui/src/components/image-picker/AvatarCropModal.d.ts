import type { ComponentType } from 'react'

export interface AvatarCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUri: string
  onCropComplete: (croppedImageDataUrl: string) => void
  cropSize?: number
  onError?: (message: string) => void
}

declare const AvatarCropModal: ComponentType<AvatarCropModalProps>

export { AvatarCropModal }
