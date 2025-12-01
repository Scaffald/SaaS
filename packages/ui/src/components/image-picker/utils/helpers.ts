export function detectMimeTypeFromSrc(src: string) {
  if (src.startsWith('data:')) {
    const match = src.match(/^data:(image\/[a-zA-Z+]+);base64,/)
    if (match) return match[1]
  }

  if (src.endsWith('.png')) return 'image/png'
  if (src.endsWith('.webp')) return 'image/webp'
  if (src.endsWith('.jpg') || src.endsWith('.jpeg')) return 'image/jpeg'

  return 'image/jpeg'
}

export function getWebTransform(
  width: number,
  height: number,
  flipHorizontal: boolean,
  flipVertical: boolean
) {
  const transforms: string[] = []
  if (flipHorizontal) {
    transforms.push(`translateX(${width}px)`)
    transforms.push('scaleX(-1)')
  }
  if (flipVertical) {
    transforms.push(`translateY(${height}px)`)
    transforms.push('scaleY(-1)')
  }
  if (!transforms.length) {
    return undefined
  }
  return transforms.join(' ')
}

export function getNativeTransform(
  width: number,
  height: number,
  flipHorizontal: boolean,
  flipVertical: boolean
) {
  const transforms: Array<
    { translateX: number } | { translateY: number } | { scaleX: number } | { scaleY: number }
  > = []

  if (flipHorizontal) {
    transforms.push({ translateX: width })
    transforms.push({ scaleX: -1 })
  } else {
    transforms.push({ scaleX: 1 })
  }

  if (flipVertical) {
    transforms.unshift({ translateY: height })
    transforms.push({ scaleY: -1 })
  } else {
    transforms.push({ scaleY: 1 })
  }

  return transforms
}
