import type { DropZoneMediaSelection, DropZoneOptionsCustom, PickerKind } from './types'

export function useDropZone<
  Media extends DropZoneMediaSelection | undefined = DropZoneMediaSelection | undefined,
  Kind extends PickerKind = 'file',
>(_options: DropZoneOptionsCustom<Media, Kind>) {
  // fallback to make kitchensink work with bento
  return {
    isDragAccept: false,
    isDragActive: false,
    isDragReject: false,
    open: () => {},
    getInputProps: <T extends any>(props?: T) => props ?? ({} as T),
    getRootProps: <T extends any>(props?: T) => props ?? ({} as T),
  }
}
