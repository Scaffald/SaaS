import type { ProcessedImageResult, ProcessImageOptions } from './imageProcessing.types'

const DEFAULT_TARGET_SIZE = 512
const DEFAULT_MAX_BYTES = 500 * 1024
const DEFAULT_JPEG_QUALITY = 0.85
const QUALITY_FLOOR = 0.5
const QUALITY_STEP = 0.05

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function resolveMimeType(preferred?: string) {
  if (preferred && SUPPORTED_MIME_TYPES.has(preferred)) {
    return preferred
  }
  return 'image/jpeg'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
  const base64 = btoa(binary)
  return `data:${blob.type};base64,${base64}`
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

  const image = await loadImage(imageSrc)
  const resolvedCrop = clampCrop(crop, imageWidth, imageHeight)

  const resolvedMimeType = resolveMimeType(preferredMimeType)
  const maxAllowedBytes = maxBytes ?? DEFAULT_MAX_BYTES

  const originalTargetSize = targetSize ?? DEFAULT_TARGET_SIZE
  const outputSize = Math.min(originalTargetSize, resolvedCrop.width, resolvedCrop.height)

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to access canvas context for image processing.')
  }

  ctx.save()

  if (flipHorizontal || flipVertical) {
    ctx.translate(flipHorizontal ? outputSize : 0, flipVertical ? outputSize : 0)
    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  }

  ctx.drawImage(
    image,
    resolvedCrop.originX,
    resolvedCrop.originY,
    resolvedCrop.width,
    resolvedCrop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  ctx.restore()

  let effectiveMimeType = resolvedMimeType
  let quality = effectiveMimeType === 'image/jpeg' ? DEFAULT_JPEG_QUALITY : undefined
  let blob = await canvasToBlob(canvas, effectiveMimeType, quality)

  // If PNG/WebP exceeds size budget, fall back to JPEG compression.
  if (blob.size > maxAllowedBytes && effectiveMimeType !== 'image/jpeg') {
    effectiveMimeType = 'image/jpeg'
    quality = DEFAULT_JPEG_QUALITY
    blob = await canvasToBlob(canvas, effectiveMimeType, quality)
  }

  if (effectiveMimeType === 'image/jpeg') {
    while (blob.size > maxAllowedBytes && quality && quality > QUALITY_FLOOR) {
      quality = Number.parseFloat((quality - QUALITY_STEP).toFixed(2))
      blob = await canvasToBlob(canvas, effectiveMimeType, quality)
    }
  }

  if (blob.size > maxAllowedBytes) {
    throw new Error('Processed image exceeds 500KB after compression.')
  }

  const dataUrl = await blobToDataUrl(blob)

  return {
    dataUrl,
    mimeType: effectiveMimeType,
    width: outputSize,
    height: outputSize,
    size: blob.size,
  }
}
