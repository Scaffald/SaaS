/**
 * Image picker types – avatar flow and useFilePicker
 */

export interface AvatarImagePickerProps {
  /** Current avatar image URI (data URL or blob URL) */
  value?: string
  /** Callback when image is selected (or cleared) */
  onImageSelect: (imageUri: string) => void
  /** Optional callback when an error occurs */
  onCropError?: (message: string) => void
  /** Size of the avatar circle in pixels */
  size?: number
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Placeholder text when no image is selected */
  placeholder?: string
}

export interface AvatarCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Image URI to display (blob:, data:, or file URI) */
  imageUri: string
  /** Callback with the confirmed image (data URL or URI). Minimal implementation passes through without cropping. */
  onCropComplete: (croppedImageDataUrl: string) => void
  /** Optional crop size hint (for future crop UI) */
  cropSize?: number
  onError?: (message: string) => void
}

/** Result of useFilePicker when used for images */
export interface UseFilePickerImageResult {
  open: () => void
  getInputProps: (props?: Record<string, unknown>) => Record<string, unknown>
  getRootProps: (props?: Record<string, unknown>) => Record<string, unknown>
  dragStatus?: {
    isDragAccept: boolean
    isDragActive: boolean
    isDragReject: boolean
  }
}

export type OnPickImage = (param: {
  webFiles: File[] | null
  nativeFiles: Array<{ uri: string; width?: number; height?: number; type?: string }> | null
}) => void | Promise<void>

export interface UseFilePickerImageProps {
  onPick: OnPickImage
  /** On native, optional; if not provided, open() is a no-op. App can use expo-image-picker and call onPick with nativeFiles. */
  onOpenNative?: () => void
}
