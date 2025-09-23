import type {
  DropEvent,
  DropzoneOptions,
  FileRejection,
  FileWithPath,
} from 'react-dropzone'
import type { DocumentPickerResult } from 'expo-document-picker'
import type { ImagePickerResult } from 'expo-image-picker'

export type PickerKind = 'file' | 'image'

export type DropZoneMediaType = 'All' | 'Videos' | 'Images' | 'Audios'

export type DropZoneMediaSelection =
  | readonly ['All']
  | readonly ['Videos']
  | readonly ['Images']
  | readonly ['Audios']
  | readonly ['Images', 'Videos']
  | readonly ['Images', 'Audios']
  | readonly ['Videos', 'Audios']
  | readonly ['Images', 'Videos', 'Audios']

export type DropZoneWebFile = FileWithPath

export type NativeFileSelection<Kind extends PickerKind> = Kind extends 'image'
  ? ImagePickerResult['assets']
  : DocumentPickerResult['assets']

export type DropZoneOnDrop = (
  acceptedFiles: DropZoneWebFile[],
  fileRejections: FileRejection[],
  event: DropEvent
) => void

export type DropZoneOnOpen<Kind extends PickerKind> = (
  nativeFiles: NativeFileSelection<Kind>
) => void

export type DropZoneOptionsCustom<
  Media extends DropZoneMediaSelection | undefined = DropZoneMediaSelection | undefined,
  Kind extends PickerKind = 'file'
> = Omit<DropzoneOptions, 'accept' | 'onDrop'> & {
  onDrop?: DropZoneOnDrop
  onOpen?: DropZoneOnOpen<Kind>
  allowsEditing?: boolean
  mediaTypes?: Media
}

export type PickerFileDescriptor = {
  fileURL: string
  path?: string
}

export type FilePickerOnPick<Kind extends PickerKind> = (param: {
  webFiles: DropZoneWebFile[] | null
  nativeFiles: NativeFileSelection<Kind> | null
}) => void | Promise<void>
