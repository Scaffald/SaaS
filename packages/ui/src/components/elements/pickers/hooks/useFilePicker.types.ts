import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'

export type DragStatusSnapshot = {
  isDragAccept: boolean
  isDragActive: boolean
  isDragReject: boolean
}

export type UseFilePickerControl = {
  open: () => void
  getInputProps: <T extends DropzoneInputProps>(props?: T | undefined) => T
  getRootProps: <T extends DropzoneRootProps>(props?: T | undefined) => T
  dragStatus?: DragStatusSnapshot
}
