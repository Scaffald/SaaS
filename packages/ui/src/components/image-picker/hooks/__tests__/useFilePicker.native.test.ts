import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const launchImageLibraryAsync = vi.hoisted(() => vi.fn())
const getDocumentAsync = vi.hoisted(() => vi.fn())
const dropZoneState = vi.hoisted(() => ({
  config: null as Record<string, unknown> | null,
  response: {
    isDragAccept: false,
    isDragActive: false,
    isDragReject: false,
  },
}))

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync,
}))

vi.mock('expo-document-picker', () => ({
  getDocumentAsync,
}))

vi.mock('../useDropZone', () => ({
  useDropZone: (config: Record<string, unknown>) => {
    dropZoneState.config = config
    return dropZoneState.response
  },
}))

vi.mock('tamagui', () => ({
  useEvent: (handler: (...args: any[]) => unknown) => handler,
}))

const { useFilePicker } = await import('../useFilePicker.native')

describe('useFilePicker (native)', () => {
  beforeEach(() => {
    launchImageLibraryAsync.mockReset()
    getDocumentAsync.mockReset()
    dropZoneState.config = null
    dropZoneState.response = {
      isDragAccept: false,
      isDragActive: false,
      isDragReject: false,
    }
  })

  it('launches image picker and returns assets to onPick', async () => {
    const onPick = vi.fn()
    const nativeAssets = [{ uri: 'native://asset' }]
    launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: nativeAssets })

    const { result } = renderHook(() =>
      useFilePicker({ typeOfPicker: 'image', mediaTypes: ['Images'], onPick })
    )

    await act(async () => {
      await result.current.open()
    })

    expect(launchImageLibraryAsync).toHaveBeenCalledWith({
      quality: 1,
      allowsMultipleSelection: false,
    })
    expect(onPick).toHaveBeenCalledWith({ webFiles: null, nativeFiles: nativeAssets })
    expect(dropZoneState.config).toEqual(
      expect.objectContaining({
        onOpen: expect.any(Function),
        noClick: true,
      })
    )
  })

  it('respects multiple selection and ignores canceled results', async () => {
    const onPick = vi.fn()
    launchImageLibraryAsync.mockResolvedValue({ canceled: true })

    const { result } = renderHook(() =>
      useFilePicker({ typeOfPicker: 'image', mediaTypes: ['Images'], onPick, multiple: true })
    )

    await act(async () => {
      await result.current.open()
    })

    expect(launchImageLibraryAsync).toHaveBeenCalledWith({
      quality: 1,
      allowsMultipleSelection: true,
    })
    expect(onPick).not.toHaveBeenCalled()
  })

  it('falls back to document picker for non-image selections', async () => {
    const onPick = vi.fn()
    const docAssets = [{ uri: 'native://doc' }]
    getDocumentAsync.mockResolvedValue({ canceled: false, assets: docAssets })

    const { result } = renderHook(() =>
      useFilePicker({ onPick, typeOfPicker: 'file', mediaTypes: ['All'] })
    )

    await act(async () => {
      await result.current.open()
    })

    expect(getDocumentAsync).toHaveBeenCalledWith({ multiple: false })
    expect(onPick).toHaveBeenCalledWith({ webFiles: null, nativeFiles: docAssets })
  })

  it('exposes drag status defaults when drop zone unsets values', () => {
    dropZoneState.response = {
      isDragAccept: undefined,
      isDragActive: undefined,
      isDragReject: undefined,
    } as any

    const { result } = renderHook(() => useFilePicker())

    expect(result.current.dragStatus).toEqual({
      isDragAccept: false,
      isDragActive: false,
      isDragReject: false,
    })
  })
})
