import * as ImageManipulator from 'expo-image-manipulator'

import type { ProcessedImageResult, ProcessImageOptions } from './imageProcessing.types'

const DEFAULT_TARGET_SIZE = 512
const DEFAULT_MAX_BYTES = 500 * 1024
const DEFAULT_JPEG_QUALITY = 0.85

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function resolveMimeType(preferred?: string) {
  if (preferred && SUPPORTED_MIME_TYPES.has(preferred)) {
    return preferred
  }
  return 'image/jpeg'
}

function clampCrop(
  crop: ProcessImageOptions['crop'],
  imageWidth: number,
  imageHeight: number
): ProcessImageOptions['crop'] {
  const originX = Math.max(0, Math.min(crop.originX, imageWidth))
  const originY = Math.max(0, Math.min(crop.originY, imageHeight))
  const maxWidth = imageWidth - originX
  const maxHeight = imageHeight - originY
  const width = Math.max(1, Math.min(crop.width, maxWidth))
  const height = Math.max(1, Math.min(crop.height, maxHeight))
  return { originX, originY, width, height }
}

async function runManipulator(
  imageSrc: string,
  actions: ImageManipulator.Action[],
  format: ImageManipulator.SaveFormat,
  compress: number
) {
  return ImageManipulator.manipulateAsync(imageSrc, actions, {
    format,
    compress,
    base64: true,
  })
}

function estimateBase64Bytes(base64?: string | null) {
  if (!base64) return 0
  return Math.floor((base64.length * 3) / 4)
}

export async function processCroppedImage(
  options: ProcessImageOptions
): Promise<ProcessedImageResult> {
  const {
    imageSrc,
    crop,
    imageWidth,
    imageHeight,
    flipHorizontal = false,
    flipVertical = false,
    mimeType: preferredMimeType,
    targetSize,
    maxBytes,
  } = options

  const resolvedCrop = clampCrop(crop, imageWidth, imageHeight)

  const resolvedMimeType = resolveMimeType(preferredMimeType)
  const maxAllowedBytes = maxBytes ?? DEFAULT_MAX_BYTES

  const originalTargetSize = targetSize ?? DEFAULT_TARGET_SIZE
  const outputSize = Math.min(originalTargetSize, resolvedCrop.width, resolvedCrop.height)

  const actions: ImageManipulator.Action[] = [
    {
      crop: {
        originX: Math.round(resolvedCrop.originX),
        originY: Math.round(resolvedCrop.originY),
        width: Math.round(resolvedCrop.width),
        height: Math.round(resolvedCrop.height),
      },
    },
  ]

  if (flipHorizontal) {
    actions.push({ flip: ImageManipulator.FlipType.Horizontal })
  }
  if (flipVertical) {
    actions.push({ flip: ImageManipulator.FlipType.Vertical })
  }

  if (outputSize < resolvedCrop.width || outputSize < resolvedCrop.height) {
    actions.push({ resize: { width: Math.round(outputSize), height: Math.round(outputSize) } })
  }

  const toFormat = (mime: string) => {
    switch (mime) {
      case 'image/png':
        return ImageManipulator.SaveFormat.PNG
      case 'image/webp':
        return ImageManipulator.SaveFormat.WEBP
      default:
        return ImageManipulator.SaveFormat.JPEG
    }
  }

  let format = toFormat(resolvedMimeType)
  let compress =
    format === ImageManipulator.SaveFormat.JPEG
      ? DEFAULT_JPEG_QUALITY
      : format === ImageManipulator.SaveFormat.WEBP
        ? DEFAULT_JPEG_QUALITY
        : 1

  let result = await runManipulator(imageSrc, actions, format, compress)
  let size = estimateBase64Bytes(result.base64)

  if (size > maxAllowedBytes && format !== ImageManipulator.SaveFormat.JPEG) {
    format = ImageManipulator.SaveFormat.JPEG
    compress = DEFAULT_JPEG_QUALITY
    result = await runManipulator(imageSrc, actions, format, compress)
    size = estimateBase64Bytes(result.base64)
  }

  if (format === ImageManipulator.SaveFormat.JPEG) {
    while (size > maxAllowedBytes && compress > 0.5) {
      compress = Number.parseFloat((compress - 0.05).toFixed(2))
      result = await runManipulator(imageSrc, actions, format, compress)
      size = estimateBase64Bytes(result.base64)
    }
  }

  if (size > maxAllowedBytes) {
    throw new Error('Processed image exceeds 500KB after compression.')
  }

  const mimeType =
    format === ImageManipulator.SaveFormat.PNG
      ? 'image/png'
      : format === ImageManipulator.SaveFormat.WEBP
        ? 'image/webp'
        : 'image/jpeg'

  const base64 = result.base64 ?? ''
  const width = result.width ?? Math.round(outputSize)
  const height = result.height ?? Math.round(outputSize)
  const dataUrl = `data:${mimeType};base64,${base64}`

  return {
    dataUrl,
    mimeType,
    width,
    height,
    size,
  }
}
