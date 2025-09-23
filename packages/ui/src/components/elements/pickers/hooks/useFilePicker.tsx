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
import type { DragStatusSnapshot, UseFilePickerControl } from './useFilePicker.types'

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

  const dropZoneResult = useDropZone({
    onDrop: _onDrop,
    onOpen,
    mediaTypes,
    noClick: true,
    ...dropzoneOptions,
  })

  const {
    open,
    getInputProps,
    getRootProps,
    isDragAccept = false,
    isDragActive = false,
    isDragReject = false,
  } = dropZoneResult

  const dragStatus: DragStatusSnapshot = {
    isDragAccept,
    isDragActive,
    isDragReject,
  }

  const control: UseFilePickerControl = {
    open,
    getInputProps,
    getRootProps,
    dragStatus,
  }

  return { control, ...control }
}
