import { useCallback, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import type { DropzoneOptions } from 'react-dropzone'

import { useFilePicker } from '../image-picker/hooks/useFilePicker'
import type {
  MediaTypeOptionsString,
  NativeFiles,
  UseFilePickerControl,
} from '../image-picker/types'
import { MediaTypeOptions } from '../image-picker/types'

type WebFile = File

interface UploadSurfaceChildrenProps {
  open: () => void
  getRootProps: UseFilePickerControl['getRootProps']
  getInputProps: UseFilePickerControl['getInputProps']
  isDragActive: boolean
  isDragReject: boolean
  isProcessing: boolean
}

export type UploadSelection =
  | {
      platform: 'web'
      file: WebFile
    }
  | {
      platform: 'native'
      asset: {
        uri: string
        name?: string
        size?: number
        type?: string
      }
    }

export interface UploadSurfaceProps {
  onSelect: (selection: UploadSelection) => Promise<void> | void
  onError?: (message: string) => void
  accept?: string
  maxSizeBytes?: number
  disabled?: boolean
  multiple?: boolean
  dropzoneOptions?: Partial<DropzoneOptions>
  children: (props: UploadSurfaceChildrenProps) => React.ReactNode
}

const DEFAULT_ACCEPT = '*/*'

export function UploadSurface({
  onSelect,
  onError,
  accept,
  maxSizeBytes,
  disabled = false,
  multiple = false,
  dropzoneOptions,
  children,
}: UploadSurfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const normalizedAcceptPatterns = useMemo(() => {
    if (!accept) return []
    return accept
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  }, [accept])

  const validateFile = useCallback(
    (name: string | undefined, size: number | undefined, type: string | undefined) => {
      if (maxSizeBytes && typeof size === 'number' && size > maxSizeBytes) {
        onError?.(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(1)}MB limit.`)
        return false
      }

      if (!normalizedAcceptPatterns.length) {
        return true
      }

      const lowerName = name?.toLowerCase() ?? ''
      const lowerType = type?.toLowerCase() ?? ''

      const matches = normalizedAcceptPatterns.some((pattern) => {
        if (pattern === DEFAULT_ACCEPT) return true
        if (pattern.startsWith('.')) {
          return lowerName.endsWith(pattern)
        }
        return lowerType === pattern
      })

      if (!matches) {
        onError?.(`File type not supported. Accepted types: ${accept}`)
      }

      return matches
    },
    [accept, maxSizeBytes, normalizedAcceptPatterns, onError]
  )

  const handlePick = useCallback(
    async ({
      webFiles,
      nativeFiles,
    }: {
      webFiles: WebFile[] | null
      nativeFiles: NativeFiles<MediaTypeOptionsString[]> | null
    }) => {
      console.debug('[UploadSurface] handlePick', {
        hasWebFiles: Boolean(webFiles?.length),
        hasNativeFiles: Boolean(nativeFiles?.length),
        disabled,
      })
      if (disabled) {
        console.debug('[UploadSurface] disabled, ignoring selection')
        return
      }

      const processWebFile = async (file: WebFile) => {
        console.debug('[UploadSurface] process web file', {
          name: file.name,
          size: file.size,
          type: file.type,
        })
        if (!validateFile(file.name, file.size, file.type)) {
          return
        }
        await onSelect({ platform: 'web', file })
      }

      const processNativeAsset = async (asset: {
        uri: string
        name?: string
        size?: number
        type?: string
      }) => {
        console.debug('[UploadSurface] process native asset', {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.type,
        })
        if (!validateFile(asset.name ?? asset.uri, asset.size, asset.type)) {
          return
        }
        await onSelect({
          platform: 'native',
          asset,
        })
      }

      setIsProcessing(true)
      try {
        if (webFiles?.length) {
          console.debug('[UploadSurface] picked web file')
          const [file] = webFiles
          await processWebFile(file)
        } else if (nativeFiles?.length) {
          console.debug('[UploadSurface] picked native file')
          const [asset] = nativeFiles
          await processNativeAsset(asset)
        } else {
          console.debug('[UploadSurface] no files provided to handlePick')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to process selected file.'
        console.error('[UploadSurface] error processing file', error)
        onError?.(message)
      } finally {
        setIsProcessing(false)
      }
    },
    [disabled, onError, onSelect, validateFile]
  )

  const { open, getInputProps, getRootProps, dragStatus } = useFilePicker({
    typeOfPicker: 'file',
    mediaTypes: [MediaTypeOptions.All],
    multiple,
    onPick: handlePick,
    noClick: true,
    disabled,
    noDrag: disabled,
    ...dropzoneOptions,
  })

  const { isDragActive = false, isDragReject = false } = dragStatus || {}

  return (
    <>
      {children({
        open,
        getRootProps,
        getInputProps,
        isDragActive,
        isDragReject,
        isProcessing,
      })}
    </>
  )
}
