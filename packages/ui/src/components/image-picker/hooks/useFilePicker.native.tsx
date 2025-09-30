import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useEvent } from 'tamagui'

import type { MediaTypeOptionsString, UseFilePickerControl, UseFilePickerProps } from '../types'
import { useDropZone } from './useDropZone'

type _NativeFiles<MT extends MediaTypeOptionsString[]> = MT[number] extends 'Images'
  ? ImagePicker.ImagePickerResult['assets']
  : DocumentPicker.DocumentPickerResult[]

export function useFilePicker<MT extends MediaTypeOptionsString>(
  props?: UseFilePickerProps<MT>
): UseFilePickerControl {
  const { mediaTypes, onPick, typeOfPicker, ...rest } = props || {}

  const _onOpenNative = useEvent((nativeFiles) => {
    if (onPick) {
      onPick({ webFiles: null, nativeFiles })
    }
  })

  const { isDragAccept, isDragActive, isDragReject } = useDropZone({
    onOpen: _onOpenNative,
    // @ts-ignore
    mediaTypes,
    noClick: true,
    ...rest,
  })

  const _handleOpenNative = async () => {
    // No permissions request is necessary for launching the image or document library
    if (typeOfPicker === 'image') {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 1,
        allowsMultipleSelection: props?.multiple || false,
      })
      if (!result.canceled && result.assets) {
        _onOpenNative(result.assets)
      }
    } else {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: props?.multiple || false,
      })
      if (!result.canceled && result.assets) {
        _onOpenNative(result.assets)
      }
    }
  }

  const control = {
    dragStatus: {
      isDragAccept: isDragAccept || false,
      isDragActive: isDragActive || false,
      isDragReject: isDragReject || false,
    },
    getInputProps: () => null,
    getRootProps: () => null,
    open: _handleOpenNative,
  }

  return { ...control }
}
