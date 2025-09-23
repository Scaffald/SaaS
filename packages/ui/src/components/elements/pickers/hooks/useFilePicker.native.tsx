import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'
import { useEvent } from 'tamagui'

import { useDropZone } from '../useDropZone'
import type {
  DropZoneMediaSelection,
  DropZoneOptionsCustom,
  FilePickerOnPick,
  NativeFileSelection,
  PickerKind,
} from '../types'
import type { UseFilePickerControl } from './useFilePicker'

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
  const { mediaTypes, onPick, typeOfPicker = 'file', ...dropzoneOptions } = props || {}

  const handleNativeSelection = useEvent((nativeFiles: NativeFileSelection<Kind>) => {
    if (onPick) {
      onPick({ webFiles: null, nativeFiles })
    }
  })

  const { isDragAccept, isDragActive, isDragReject } = useDropZone({
    onOpen: handleNativeSelection,
    mediaTypes,
    noClick: true,
    ...dropzoneOptions,
  })

  const openNative = async () => {
    if (typeOfPicker === 'image') {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsMultipleSelection: true,
      })
      handleNativeSelection(result.assets)
    } else {
      const result = await DocumentPicker.getDocumentAsync()
      handleNativeSelection(result.assets)
    }
  }

  const getInputProps = <T extends DropzoneInputProps>(props?: T) => props ?? ({} as T)
  const getRootProps = <T extends DropzoneRootProps>(props?: T) => props ?? ({} as T)

  const control: UseFilePickerControl = {
    dragStatus: {
      isDragAccept: Boolean(isDragAccept),
      isDragActive: Boolean(isDragActive),
      isDragReject: Boolean(isDragReject),
    },
    getInputProps,
    getRootProps,
    open: openNative,
  }

  return { control, ...control }
}
