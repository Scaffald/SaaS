import type { DropzoneOptions } from 'react-dropzone'

export type DropZoneOptionsCustom = Omit<DropzoneOptions, 'accept'> & {
  accept?: DropzoneOptions['accept']
  // native only
  onOpen: DropzoneOptions['onDrop']
  // native only
  allowsEditing?: boolean
  mediaTypes?: MediaTypeOptions[]
}

export enum MediaTypeOptions {
  /**
   * Images and videos.
   */
  All = 'All',
  /**
   * Only videos.
   */
  Videos = 'Videos',
  /**
   * Only images.
   */
  Images = 'Images',
  /**
   * Only audio files.
   */
  Audios = 'Audios',
}

export type MediaTypeOptionsString = 'All' | 'Videos' | 'Images' | 'Audios'

export type NativeFiles<MT extends MediaTypeOptionsString[]> = MT[number] extends 'Images'
  ? Array<{ uri: string; width?: number; height?: number; type?: string }>
  : Array<{ uri: string; name?: string; size?: number; type?: string }>

export type OnPickType<MT extends MediaTypeOptionsString[]> = (param: {
  webFiles: File[] | null
  nativeFiles: NativeFiles<MT> | null
}) => void | Promise<void>

export type UseFilePickerProps<MT extends MediaTypeOptionsString> = {
  mediaTypes?: MT[]
  onPick: OnPickType<MT[]>
  /** multiple only works for image only types on native, but on web it works regarding the media types */
  multiple?: boolean
  typeOfPicker: 'file' | 'image'
} & Partial<Omit<DropZoneOptionsCustom, 'mediaTypes' | 'onOpen'>>

export type UseFilePickerControl = {
  open: () => void
  getInputProps: (props?: Record<string, unknown>) => Record<string, unknown>
  getRootProps: (props?: Record<string, unknown>) => Record<string, unknown>
  dragStatus?: {
    isDragAccept: boolean
    isDragActive: boolean
    isDragReject: boolean
  }
}

export type AvatarImagePickerProps = {
  /** Current avatar image URI */
  value?: string
  /** Callback when image is selected */
  onImageSelect: (imageUri: string) => void
  /** Optional callback when cropper encounters an error */
  onCropError?: (message: string) => void
  /** Size of the avatar picker */
  size?: number
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Placeholder text when no image is selected */
  placeholder?: string
}
