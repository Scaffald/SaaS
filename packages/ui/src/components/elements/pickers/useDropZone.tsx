// vite cjs compat:
import * as DropZone from 'react-dropzone'

import type { DropZoneMediaType, DropZoneOptionsCustom } from './types'

type AcceptRecord = Record<string, string[]>

export function useDropZone(options: DropZoneOptionsCustom) {
  const { mediaTypes, onOpen: _onOpen, allowsEditing: _allowsEditing, ...dropzoneOptions } = options

  const acceptFromMediaTypes = mediaTypes?.reduce<AcceptRecord>((acc, mediaType) => {
    return { ...acc, ...mimeTypes[mediaType] }
  }, {})

  return DropZone.useDropzone({
    ...dropzoneOptions,
    accept: acceptFromMediaTypes && Object.keys(acceptFromMediaTypes).length > 0 ? acceptFromMediaTypes : { '*/*': [] },
  })
}

const mimeTypes: Record<DropZoneMediaType, AcceptRecord> = {
  Images: {
    'image/*': [],
  },
  Videos: {
    'video/*': [],
  },
  Audios: {
    'audio/*': [],
  },
  All: {
    '*/*': [],
  },
}
