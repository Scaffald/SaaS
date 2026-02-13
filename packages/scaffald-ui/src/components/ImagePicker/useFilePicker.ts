/**
 * useFilePicker – image picker hook for web (file input + optional drag) and native (optional callback).
 * For native, pass onOpenNative and call it from your expo-image-picker flow; otherwise open() is a no-op.
 */

import { useCallback, useRef, useState } from 'react'
import { Platform } from 'react-native'
import type { UseFilePickerImageProps, UseFilePickerImageResult } from './ImagePicker.types'

export function useFilePicker(props: UseFilePickerImageProps): UseFilePickerImageResult {
  const { onPick, onOpenNative } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const open = useCallback(() => {
    if (Platform.OS === 'web' && inputRef.current) {
      inputRef.current.click()
    } else if (onOpenNative) {
      onOpenNative()
    }
  }, [onOpenNative])

  const handleFile = useCallback(
    (file: File | null) => {
      if (file) {
        onPick({ webFiles: [file], nativeFiles: null })
      }
    },
    [onPick]
  )

  const getInputProps = useCallback(
    (opts?: Record<string, unknown>) => {
      if (Platform.OS !== 'web') {
        return { ...opts }
      }
      return {
        ...opts,
        ref: (el: HTMLInputElement | null) => {
          inputRef.current = el
          if (typeof (opts?.ref as (el: HTMLInputElement | null) => void) === 'function') {
            ;(opts?.ref as (el: HTMLInputElement | null) => void)(el)
          }
        },
        type: 'file',
        accept: 'image/*',
        style: { display: 'none' },
        onChange: (e: { target?: { files?: File[] | null; value?: string } }) => {
          const file = e.target?.files?.[0] ?? null
          handleFile(file)
          if (e.target) e.target.value = ''
        },
      }
    },
    [handleFile]
  )

  const getRootProps = useCallback(
    (opts?: Record<string, unknown>) => {
      if (Platform.OS !== 'web') {
        return { ...opts, onPress: open }
      }
      return {
        ...opts,
        onClick: (e: { preventDefault: () => void }) => {
          e.preventDefault()
          open()
          const onClickFn = opts?.onClick as ((e: unknown) => void) | undefined
          if (onClickFn) onClickFn(e)
        },
        onDragOver: (e: { preventDefault: () => void; stopPropagation: () => void }) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragActive(true)
          const onDragOverFn = opts?.onDragOver as ((e: unknown) => void) | undefined
          if (onDragOverFn) onDragOverFn(e)
        },
        onDragLeave: (e: { preventDefault: () => void }) => {
          e.preventDefault()
          setIsDragActive(false)
          const onDragLeaveFn = opts?.onDragLeave as ((e: unknown) => void) | undefined
          if (onDragLeaveFn) onDragLeaveFn(e)
        },
        onDrop: (e: {
          preventDefault: () => void
          stopPropagation: () => void
          dataTransfer?: { files?: File[] }
        }) => {
          e.preventDefault()
          e.stopPropagation()
          setIsDragActive(false)
          const file = e.dataTransfer?.files?.[0] ?? null
          if (file?.type?.startsWith('image/')) {
            handleFile(file)
          }
          const onDropFn = opts?.onDrop as ((e: unknown) => void) | undefined
          if (onDropFn) onDropFn(e)
        },
      }
    },
    [open, handleFile]
  )

  return {
    open,
    getInputProps,
    getRootProps,
    dragStatus: {
      isDragAccept: true,
      isDragActive,
      isDragReject: false,
    },
  }
}
