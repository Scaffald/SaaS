import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'
import { useEvent } from 'tamagui'

import { useDropZone } from '../useDropZone'
import type {
  DropZoneMediaSelection,
  DropZoneOptionsCustom,
  DropZoneWebFile,
  NativeFileSelection,
  PickerKind,
  FilePickerOnPick,
} from '../types'

export type UseFilePickerControl = {
  open: () => void
  getInputProps: <T extends DropzoneInputProps>(props?: T | undefined) => T
  getRootProps: <T extends DropzoneRootProps>(props?: T | undefined) => T
  dragStatus?: {
    isDragAccept: boolean
    isDragActive: boolean
    isDragReject: boolean
  }
}

type UseFilePickerProps<
  Media extends DropZoneMediaSelection | undefined = DropZoneMediaSelection | undefined,
  Kind extends PickerKind = 'file',
> = {
  mediaTypes?: Media
  onPick?: FilePickerOnPick<Kind>
  typeOfPicker?: Kind
} & Omit<DropZoneOptionsCustom<Media, Kind>, 'mediaTypes' | 'onDrop' | 'onOpen'>

export function useFilePicker<
  Media extends DropZoneMediaSelection | undefined = DropZoneMediaSelection | undefined,
  Kind extends PickerKind = 'file',
>(props?: UseFilePickerProps<Media, Kind>) {
  const {
    mediaTypes,
    onPick,
    typeOfPicker: _typeOfPicker = 'file',
    ...dropzoneOptions
  } = props || {}

  const _onDrop = useEvent((webFiles: DropZoneWebFile[]) => {
    if (onPick) {
      onPick({ webFiles, nativeFiles: null })
    }
  })

  const onOpen = useEvent((nativeFiles: NativeFileSelection<Kind>) => {
    if (onPick) {
      onPick({ webFiles: null, nativeFiles })
    }
  })

  const { open, getInputProps, getRootProps, isDragAccept, isDragActive, isDragReject } =
    useDropZone({
      onDrop: _onDrop,
      onOpen,
      mediaTypes,
      noClick: true,
      ...dropzoneOptions,
    })

  const control = {
    open,
    getInputProps,
    getRootProps,
    dragStatus: {
      isDragAccept,
      isDragActive,
      isDragReject,
    },
  }

  return { control, ...control }
}
