import type * as DocumentPicker from 'expo-document-picker'
import type * as ImagePicker from 'expo-image-picker/src/ImagePicker'
import { useEvent } from 'tamagui'

import type { MediaTypeOptionsString, UseFilePickerControl, UseFilePickerProps } from '../types'
import { useDropZone } from './useDropZone'

type _NativeFiles<MT extends MediaTypeOptionsString[]> = MT[number] extends 'Images'
  ? ImagePicker.ImagePickerResult['assets']
  : DocumentPicker.DocumentPickerResult[]

export function useFilePicker<MT extends MediaTypeOptionsString>(
  props?: UseFilePickerProps<MT>
): UseFilePickerControl {
  const { mediaTypes, onPick, ...rest } = props || {}

  const _onDrop = useEvent((webFiles) => {
    if (onPick) {
      onPick({ webFiles, nativeFiles: null })
    }
  })

  const onOpen = useEvent((nativeFiles) => {
    if (onPick) {
      onPick({ webFiles: null, nativeFiles })
    }
  })

  const { open, getInputProps, getRootProps, isDragAccept, isDragActive, isDragReject } =
    useDropZone({
      // this is web only, it triggers both on drop and open
      onDrop: _onDrop,
      // this is native only
      onOpen,
      // @ts-expect-error
      mediaTypes,
      noClick: true,
      ...rest,
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

  return { ...control }
}
