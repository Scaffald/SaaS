export interface CropRect {
  originX: number
  originY: number
  width: number
  height: number
}

export interface ProcessImageOptions {
  imageSrc: string
  crop: CropRect
  imageWidth: number
  imageHeight: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  mimeType?: string
  targetSize?: number
  maxBytes?: number
}

export interface ProcessedImageResult {
  dataUrl: string
  mimeType: string
  width: number
  height: number
  size: number
}
