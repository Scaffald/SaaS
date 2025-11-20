// vite cjs compat:
import * as DropZone from 'react-dropzone'

import type { DropZoneOptionsCustom } from '../types'

export function useDropZone(options: DropZoneOptionsCustom) {
  const acceptFromMediaTypes = options.mediaTypes
    ?.map((mediaType) => mimTypes[mediaType])
    .reduce(
      (acc, value) => {
        if (!value) {
          return acc
        }
        // Use direct property assignment instead of Object.assign for better performance
        for (const [key, val] of Object.entries(value)) {
          acc[key] = val
        }
        return acc
      },
      {} as Record<string, string[]>
    )

  const accept =
    options.accept && Object.keys(options.accept).length > 0
      ? options.accept
      : acceptFromMediaTypes && Object.keys(acceptFromMediaTypes).length > 0
        ? acceptFromMediaTypes
        : undefined

  return DropZone.useDropzone({
    ...options,
    accept,
  })
}

const mimTypes = {
  Images: {
    'image/*': [],
  },
  Videos: {
    'video/*': [],
  },
  Audios: {
    'audio/*': [],
  },
  All: undefined,
}
