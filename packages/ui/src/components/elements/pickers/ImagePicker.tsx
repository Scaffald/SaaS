import { X } from '@tamagui/lucide-icons'
import { useId, useState, forwardRef } from 'react'
import { Platform } from 'react-native'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'
import { Button, Image, Label, ScrollView, View, XStack } from 'tamagui'

import { useFilePicker } from './hooks/useFilePicker'
import type { DropZoneWebFile, PickerFileDescriptor } from './types'

type ImagePickerProps = {
  disabled?: boolean
  value?: PickerFileDescriptor
  onChangeText?: (imageSource: PickerFileDescriptor) => void
  onBlur?: () => void
  placeholder?: string
}

enum MediaTypeOptions {
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
}

const createFileDescriptor = (file: DropZoneWebFile): PickerFileDescriptor => ({
  fileURL: URL.createObjectURL(file),
  path: file.path,
})

/** ------ EXAMPLE ------ */
// biome-ignore lint/suspicious/noExplicitAny: Example component with flexible ref type
export const ImagePicker = forwardRef<any, ImagePickerProps>(
  (
    {
      disabled,
      value,
      onChangeText,
      onBlur,
      placeholder,
    },
    ref
  ) => {
    const id = useId()
    const [images, setImages] = useState<string[]>([])
    const { open, getInputProps, getRootProps, dragStatus } = useFilePicker({
      typeOfPicker: 'image',
      mediaTypes: [MediaTypeOptions.Images] as const,
      multiple: true,

      onPick: ({ webFiles, nativeFiles }) => {
        if (webFiles?.length) {
          const descriptors = webFiles.map(createFileDescriptor)
          const [firstImage] = descriptors

          if (firstImage && onChangeText) {
            onChangeText(firstImage)
            setImages((current) => [...current, firstImage.fileURL])
          }
        } else if (nativeFiles?.length) {
          // Native image selection is handled separately
        }
      },
    })

    const isDragActive = Boolean(dragStatus?.isDragActive)
    const isWeb = Platform.OS === 'web'

    if (isWeb) {
      const rootProps = getRootProps()
      const inputProps = getInputProps()

      return (
        <View
          flexDirection="column"
          // biome-ignore lint/suspicious/noExplicitAny: Example component with flexible props
          {...(rootProps as any)}
          borderStyle="dashed"
          id="image-picker"
          maxWidth={600}
          width="100%"
          height={350}
          justifyContent="center"
          alignItems="center"
          borderWidth={isDragActive ? 2 : 1}
          borderColor={isDragActive ? '$gray11' : '$gray9'}
          gap="$2"
          borderRadius="$true"
        >
          <View
            id={id}
            tag="input"
            width={0}
            height={0}
            // biome-ignore lint/suspicious/noExplicitAny: Example component with flexible props
            {...(inputProps as any)}
            // biome-ignore lint/suspicious/noExplicitAny: Example component with flexible ref
            ref={ref as any}
          />
          <View>
            <Button size="$3" onPress={open} disabled={disabled}>
              Pick image
            </Button>

            <View width="100%" alignItems="center" justifyContent="center">
              <Label
                display={images.length ? 'none' : 'flex'}
                $platform-native={{
                  display: 'none',
                }}
                size="$3"
                htmlFor={id}
                color="$color9"
                t="$1"
                pos="absolute"
                whiteSpace="nowrap"
              >
                Drag cover image into this area
              </Label>
            </View>
          ))}
        </XStack>
      </ScrollView>
    </View>
  )
})