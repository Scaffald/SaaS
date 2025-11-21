import { Check, X } from '@tamagui/lucide-icons'
import {
  type ComponentRef,
  type MouseEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Platform, Image as RNImage } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  Button,
  Image as TamaguiImage,
  Text,
  useWindowDimensions,
  View,
  XStack,
  YStack,
} from 'tamagui'
import { Dialog } from '../dialog/Dialog'
import { Sheet } from '../sheets/Sheet'
import { detectMimeTypeFromSrc, getNativeTransform, getWebTransform } from './utils/helpers'
import { processCroppedImage } from './utils/imageProcessing'

import type { CropRect } from './utils/imageProcessing.types'

export interface AvatarCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUri: string
  onCropComplete: (croppedImageDataUrl: string) => void
  cropSize?: number
  onError?: (message: string) => void
}

const OUTPUT_TARGET_SIZE = 512
const MAX_FILE_BYTES = 500 * 1024
const PREVIEW_SIZE = 120
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_MULTIPLIER = 1.1

const ERROR_MESSAGES = {
  invalidDimensions: 'Invalid image dimensions. Please try a different photo.',
  tooSmall: 'Image is too small. Minimum recommended size is %s.',
  loadFailed: 'Failed to load image. Please try again.',
  processingFailed: 'We could not process your image. Please try again.',
} as const

function formatPixels(value: number) {
  return `${Math.round(value)}px`
}

export function AvatarCropModal({
  open,
  onOpenChange,
  imageUri,
  onCropComplete,
  cropSize = 300,
  onError,
}: AvatarCropModalProps) {
  // Use window dimensions for conditional rendering and calculations
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width, height } = useWindowDimensions()
  const isMobile = width <= 800
  const isLandscape = width > height
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [error, setError] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const firstControlRef = useRef<ComponentRef<typeof Button> | null>(null)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  const resolvedMimeType = useMemo(() => detectMimeTypeFromSrc(imageUri), [imageUri])

  const maxDisplaySize = isMobile
    ? Math.min(width - 64, height - 200)
    : Math.min(600, width - 128, height - 200)
  const displaySize = Math.max(360, Math.min(maxDisplaySize, cropSize * 1.5))

  const resetState = useCallback(() => {
    setZoom(1)
    setCropPosition({ x: 0, y: 0 })
    setFlipHorizontal(false)
    setFlipVertical(false)
    setError(null)
    setImageLoaded(false)
    setIsProcessing(false)
  }, [])

  useEffect(() => {
    if (!imageUri || !open) {
      resetState()
      return
    }

    if (Platform.OS !== 'web') {
      RNImage.getSize(
        imageUri,
        (nativeWidth, nativeHeight) => {
          if (nativeWidth === 0 || nativeHeight === 0) {
            setError(ERROR_MESSAGES.invalidDimensions)
            setImageLoaded(false)
            return
          }

          const minDimension = Math.min(nativeWidth, nativeHeight)
          if (minDimension < cropSize * 0.5) {
            setError(ERROR_MESSAGES.tooSmall.replace('%s', `${cropSize * 2}x${cropSize * 2}px`))
          } else {
            setError(null)
          }

          setImageDimensions({ width: nativeWidth, height: nativeHeight })

          const baseScale = displaySize / Math.max(nativeWidth, nativeHeight)
          const initialZoom = Math.max(1, baseScale * 1.2)
          setZoom(initialZoom)

          const initialCropSize = Math.min(nativeWidth, nativeHeight, cropSize)
          setCropPosition({
            x: Math.max(0, (nativeWidth - initialCropSize) / 2),
            y: Math.max(0, (nativeHeight - initialCropSize) / 2),
          })

          setImageLoaded(true)
        },
        (err) => {
          console.error('Failed to load native image dimensions:', err)
          setError(ERROR_MESSAGES.loadFailed)
          setImageLoaded(false)
        }
      )

      return
    }

    const ImageCtor = (
      globalThis as {
        Image?: new () => HTMLImageElement
      }
    ).Image

    if (!ImageCtor) {
      setError(ERROR_MESSAGES.loadFailed)
      setImageLoaded(false)
      return
    }

    const img = new ImageCtor()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          throw new Error(ERROR_MESSAGES.invalidDimensions)
        }

        const minDimension = Math.min(img.naturalWidth, img.naturalHeight)
        if (minDimension < cropSize * 0.5) {
          setError(ERROR_MESSAGES.tooSmall.replace('%s', `${cropSize * 2}x${cropSize * 2}px`))
        } else {
          setError(null)
        }

        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })

        const baseScale = displaySize / Math.max(img.naturalWidth, img.naturalHeight)
        const initialZoom = Math.max(1, baseScale * 1.2)
        setZoom(initialZoom)

        const initialCropSize = Math.min(img.naturalWidth, img.naturalHeight, cropSize)
        setCropPosition({
          x: Math.max(0, (img.naturalWidth - initialCropSize) / 2),
          y: Math.max(0, (img.naturalHeight - initialCropSize) / 2),
        })

        imageRef.current = img
        setImageLoaded(true)
      } catch (err) {
        console.error('Error loading image:', err)
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.loadFailed)
        setImageLoaded(false)
      }
    }

    img.onerror = () => {
      console.error('Failed to load image for cropping.')
      setError(ERROR_MESSAGES.loadFailed)
      setImageLoaded(false)
    }

    img.src = imageUri
  }, [imageUri, open, cropSize, displaySize, resetState])

  const actualCropSize =
    imageDimensions.width > 0 && imageDimensions.height > 0
      ? Math.min(imageDimensions.width, imageDimensions.height, cropSize)
      : cropSize

  const baseScale =
    imageDimensions.width > 0 && imageDimensions.height > 0
      ? displaySize / Math.max(imageDimensions.width, imageDimensions.height)
      : 1

  const scale = baseScale * zoom

  const scaledImageWidth = imageDimensions.width * scale
  const scaledImageHeight = imageDimensions.height * scale

  const cropDisplaySize = actualCropSize * baseScale

  const cropAreaTopLeft = useMemo(() => {
    const cropAreaTopLeftX = displaySize / 2 - cropDisplaySize / 2
    const cropAreaTopLeftY = displaySize / 2 - cropDisplaySize / 2
    return { x: cropAreaTopLeftX, y: cropAreaTopLeftY }
  }, [displaySize, cropDisplaySize])

  const currentCropSize = useMemo(() => {
    if (zoom <= 0) return actualCropSize
    return actualCropSize / zoom
  }, [actualCropSize, zoom])

  const previewScaleFactor = cropDisplaySize > 0 ? PREVIEW_SIZE / cropDisplaySize : 1

  const previewImageWidth = scaledImageWidth * previewScaleFactor
  const previewImageHeight = scaledImageHeight * previewScaleFactor

  const previewLeft = -(cropPosition.x * scale - cropAreaTopLeft.x) * previewScaleFactor
  const previewTop = -(cropPosition.y * scale - cropAreaTopLeft.y) * previewScaleFactor

  const getMaxCropPosition = useCallback(() => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return { maxX: 0, maxY: 0 }
    }
    return {
      maxX: Math.max(0, imageDimensions.width - currentCropSize),
      maxY: Math.max(0, imageDimensions.height - currentCropSize),
    }
  }, [imageDimensions, currentCropSize])

  const constrainCropPosition = useCallback(
    (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn('Invalid crop position values:', { x, y })
        return { x: 0, y: 0 }
      }

      const { maxX, maxY } = getMaxCropPosition()

      return {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      }
    },
    [getMaxCropPosition]
  )

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, prev * ZOOM_MULTIPLIER)
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      return next
    })
  }, [constrainCropPosition])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, prev / ZOOM_MULTIPLIER)
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      return next
    })
  }, [constrainCropPosition])

  const handleZoomReset = useCallback(() => {
    const newBaseScale =
      imageDimensions.width > 0 && imageDimensions.height > 0
        ? displaySize / Math.max(imageDimensions.width, imageDimensions.height)
        : 1
    const initialZoom = Math.max(1, newBaseScale * 1.2)
    setZoom(initialZoom)
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      const initialCropSize = Math.min(imageDimensions.width, imageDimensions.height, cropSize)
      setCropPosition({
        x: Math.max(0, (imageDimensions.width - initialCropSize) / 2),
        y: Math.max(0, (imageDimensions.height - initialCropSize) / 2),
      })
    }
  }, [imageDimensions, displaySize, cropSize])

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (Platform.OS !== 'web' || !imageLoaded) return
      event.preventDefault()

      const multiplier = event.deltaY > 0 ? 1 / ZOOM_MULTIPLIER : ZOOM_MULTIPLIER
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * multiplier))
        setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
        return next
      })
    },
    [constrainCropPosition, imageLoaded]
  )

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (Platform.OS !== 'web' || !containerRef.current) return
      event.preventDefault()
      setIsDragging(true)

      const rect = containerRef.current.getBoundingClientRect()
      const mouseXInContainer = event.clientX - rect.left
      const mouseYInContainer = event.clientY - rect.top

      const mouseXInImage = (mouseXInContainer - cropAreaTopLeft.x) / scale
      const mouseYInImage = (mouseYInContainer - cropAreaTopLeft.y) / scale

      setDragStart({
        x: mouseXInImage - cropPosition.x,
        y: mouseYInImage - cropPosition.y,
      })
    },
    [cropAreaTopLeft.x, cropAreaTopLeft.y, cropPosition, scale]
  )

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || Platform.OS !== 'web' || !containerRef.current) return
      event.preventDefault()

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const mouseXInContainer = event.clientX - rect.left
        const mouseYInContainer = event.clientY - rect.top

        const mouseXInImage = (mouseXInContainer - cropAreaTopLeft.x) / scale
        const mouseYInImage = (mouseYInContainer - cropAreaTopLeft.y) / scale

        const newX = mouseXInImage - dragStart.x
        const newY = mouseYInImage - dragStart.y

        setCropPosition(constrainCropPosition(newX, newY))
      })
    },
    [
      constrainCropPosition,
      cropAreaTopLeft.x,
      cropAreaTopLeft.y,
      dragStart.x,
      dragStart.y,
      isDragging,
      scale,
    ]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (imageLoaded && imageDimensions.width > 0 && imageDimensions.height > 0) {
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
    }
  }, [constrainCropPosition, imageDimensions, imageLoaded, zoom])

  useEffect(() => {
    if (!imageLoaded) return
    setLiveAnnouncement(`Zoom level ${Math.round(zoom * 100)} percent`)
  }, [imageLoaded, zoom])

  const lastPanPosition = useRef({ x: 0, y: 0 })
  const lastZoom = useRef(1)

  const pinchGesture = useMemo(() => {
    if (Platform.OS === 'web' || !imageLoaded) return null

    return Gesture.Pinch()
      .onStart(() => {
        lastZoom.current = zoom
      })
      .onUpdate((event) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastZoom.current * event.scale))
        setZoom(next)
      })
      .onEnd(() => {
        setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      })
  }, [constrainCropPosition, imageLoaded, zoom])

  const panGesture = useMemo(() => {
    if (Platform.OS === 'web' || !imageLoaded) return null

    return Gesture.Pan()
      .onStart(() => {
        lastPanPosition.current = { ...cropPosition }
      })
      .onUpdate((event) => {
        const deltaX = event.translationX / scale
        const deltaY = event.translationY / scale

        const newX = lastPanPosition.current.x - deltaX
        const newY = lastPanPosition.current.y - deltaY

        setCropPosition(constrainCropPosition(newX, newY))
      })
      .onEnd(() => {
        setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      })
  }, [constrainCropPosition, cropPosition, imageLoaded, scale])

  const combinedGesture = useMemo(() => {
    if (Platform.OS === 'web' || !imageLoaded || !pinchGesture || !panGesture) return null
    return Gesture.Simultaneous(pinchGesture, panGesture)
  }, [imageLoaded, panGesture, pinchGesture])

  const toggleFlipHorizontal = useCallback(() => {
    setFlipHorizontal((prev) => !prev)
  }, [])

  const toggleFlipVertical = useCallback(() => {
    setFlipVertical((prev) => !prev)
  }, [])

  const cropRect: CropRect = useMemo(() => {
    const constrained = constrainCropPosition(cropPosition.x, cropPosition.y)
    const widthPx = Math.min(currentCropSize, imageDimensions.width)
    const heightPx = Math.min(currentCropSize, imageDimensions.height)

    return {
      originX: Math.round(constrained.x),
      originY: Math.round(constrained.y),
      width: Math.max(1, Math.round(widthPx)),
      height: Math.max(1, Math.round(heightPx)),
    }
  }, [constrainCropPosition, cropPosition, currentCropSize, imageDimensions])

  const handleSave = useCallback(async () => {
    if (!imageLoaded) return

    setIsProcessing(true)
    try {
      const targetSize = Math.min(OUTPUT_TARGET_SIZE, cropRect.width, cropRect.height)

      const result = await processCroppedImage({
        imageSrc: imageUri,
        crop: cropRect,
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
        flipHorizontal,
        flipVertical,
        mimeType: resolvedMimeType,
        targetSize,
        maxBytes: MAX_FILE_BYTES,
      })

      onCropComplete(result.dataUrl)
      onOpenChange(false)
    } catch (err) {
      console.error('Image processing error:', err)
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.processingFailed
      setError(message)
      onError?.(message)
    } finally {
      setIsProcessing(false)
    }
  }, [
    cropRect,
    flipHorizontal,
    flipVertical,
    imageDimensions.height,
    imageDimensions.width,
    imageLoaded,
    imageUri,
    onCropComplete,
    onError,
    onOpenChange,
    resolvedMimeType,
  ])

  const saveButtonDisabled = !imageLoaded || isProcessing

  useEffect(() => {
    if (!open || !imageLoaded) {
      return
    }
    if (Platform.OS === 'web') {
      const node = firstControlRef.current as HTMLElement | null
      node?.focus?.()
    }
  }, [open, imageLoaded])

  useEffect(() => {
    if (Platform.OS !== 'web' || !open) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
      }
      if (!isProcessing && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        handleZoomIn()
      }
      if (!isProcessing && (event.key === '-' || event.key === '_')) {
        event.preventDefault()
        handleZoomOut()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange, isProcessing, handleZoomIn, handleZoomOut])

  const renderControls = () => null

  if (isMobile) {
    return (
      <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[90]} dismissOnSnapToBottom>
        <Sheet.Overlay />
        <Sheet.Frame>
          <Sheet.Handle />
          <XStack
            px="$4"
            pt="$3"
            pb="$2"
            justify="space-between"
            items="center"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text fontSize="$6" fontWeight="700" flex={1}>
              Crop Avatar
            </Text>
            <Button
              size="$3"
              circular
              chromeless
              icon={X}
              onPress={() => onOpenChange(false)}
              disabled={isProcessing}
            />
          </XStack>

          <YStack p="$4" gap="$4" flex={1}>
            {error ? (
              <YStack items="center" justify="center" gap="$3" flex={1}>
                <Text fontSize="$4" color="$red10" text="center" fontWeight="600">
                  Error
                </Text>
                <Text fontSize="$3" color="$color11" text="center">
                  {error}
                </Text>
                <Button variant="outlined" onPress={() => onOpenChange(false)}>
                  Close
                </Button>
              </YStack>
            ) : imageLoaded ? (
              <YStack flex={1} items="center" justify="center" gap="$4" width="100%">
                {(() => {
                  const liveRegionProps =
                    Platform.OS === 'web'
                      ? ({
                          'aria-live': 'polite',
                          'aria-atomic': 'true',
                        } as const)
                      : ({ accessibilityLiveRegion: 'polite' } as const)

                  const liveRegion = (
                    <View
                      {...liveRegionProps}
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        overflow: 'hidden',
                        left: -9999,
                        top: -9999,
                      }}
                    >
                      <Text>{liveAnnouncement}</Text>
                    </View>
                  )

                  const controls = renderControls()

                  const cropContent = (
                    <View
                      position="relative"
                      width={displaySize}
                      height={displaySize}
                      bg="$color2"
                      rounded="$4"
                      overflow="hidden"
                      aria-role="image"
                      aria-label="Avatar crop area. Drag to reposition and pinch to zoom."
                    >
                      <TamaguiImage
                        source={{ uri: imageUri }}
                        width={scaledImageWidth}
                        height={scaledImageHeight}
                        style={{
                          position: 'absolute',
                          left: cropAreaTopLeft.x - cropPosition.x * scale,
                          top: cropAreaTopLeft.y - cropPosition.y * scale,
                          transform: getNativeTransform(
                            scaledImageWidth,
                            scaledImageHeight,
                            flipHorizontal,
                            flipVertical
                          ),
                        }}
                      />

                      <View
                        position="absolute"
                        t={0}
                        l={0}
                        width={displaySize}
                        height={(displaySize - cropDisplaySize) / 2}
                        bg="rgba(0, 0, 0, 0.5)"
                        pointerEvents="none"
                      />
                      <View
                        position="absolute"
                        b={0}
                        l={0}
                        width={displaySize}
                        height={(displaySize - cropDisplaySize) / 2}
                        bg="rgba(0, 0, 0, 0.5)"
                        pointerEvents="none"
                      />
                      <View
                        position="absolute"
                        t={(displaySize - cropDisplaySize) / 2}
                        l={0}
                        width={(displaySize - cropDisplaySize) / 2}
                        height={cropDisplaySize}
                        bg="rgba(0, 0, 0, 0.5)"
                        pointerEvents="none"
                      />
                      <View
                        position="absolute"
                        t={(displaySize - cropDisplaySize) / 2}
                        r={0}
                        width={(displaySize - cropDisplaySize) / 2}
                        height={cropDisplaySize}
                        bg="rgba(0, 0, 0, 0.5)"
                        pointerEvents="none"
                      />

                      <View
                        position="absolute"
                        l={(displaySize - cropDisplaySize) / 2}
                        t={(displaySize - cropDisplaySize) / 2}
                        width={cropDisplaySize}
                        height={cropDisplaySize}
                        borderWidth={2}
                        borderColor="$blue10"
                        rounded="$2"
                        shadowColor="$shadowColor"
                        shadowOffset={{ width: 0, height: 2 }}
                        shadowOpacity={0.3}
                        shadowRadius={8}
                        pointerEvents="none"
                      />
                    </View>
                  )

                  const cropper =
                    combinedGesture !== null ? (
                      <GestureDetector gesture={combinedGesture}>{cropContent}</GestureDetector>
                    ) : (
                      cropContent
                    )

                  if (isLandscape) {
                    return (
                      <>
                        {liveRegion}
                        <XStack gap="$4" width="100%" justify="center" items="center">
                          {cropper}
                          <YStack gap="$4" maxW={280} items="center">
                            <Text fontSize="$3" color="$color11" text="center">
                              Pinch to zoom • Drag to position
                            </Text>
                            {controls}
                          </YStack>
                        </XStack>
                      </>
                    )
                  }

                  return (
                    <>
                      {liveRegion}
                      <Text fontSize="$3" color="$color11" text="center">
                        Pinch to zoom • Drag to position
                      </Text>
                      {controls}
                      {cropper}
                    </>
                  )
                })()}

                <XStack gap="$3" width="100%">
                  <Button flex={1} variant="outlined" onPress={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    theme="info"
                    onPress={handleSave}
                    icon={Check}
                    disabled={saveButtonDisabled}
                    opacity={saveButtonDisabled ? 0.6 : 1}
                  >
                    {isProcessing ? 'Processing…' : 'Save'}
                  </Button>
                </XStack>
              </YStack>
            ) : (
              <YStack items="center" justify="center" flex={1}>
                <Text>Loading image...</Text>
              </YStack>
            )}
          </YStack>
        </Sheet.Frame>
      </Sheet>
    )
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content
          key="content"
          gap="$0"
          width={displaySize + 128}
          maxW="90vw"
          height={displaySize + 250}
          maxH="90vh"
        >
          <XStack
            p="$4"
            justify="space-between"
            items="center"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Dialog.Title fontSize="$6" fontWeight="700" flex={1}>
              Crop Avatar
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button size="$3" circular chromeless icon={X} disabled={isProcessing} />
            </Dialog.Close>
          </XStack>

          <YStack p="$4" gap="$4" items="center">
            {error ? (
              <YStack items="center" justify="center" gap="$3" minH={displaySize}>
                <Text fontSize="$4" color="$red10" text="center" fontWeight="600">
                  Error
                </Text>
                <Text fontSize="$3" color="$color11" text="center">
                  {error}
                </Text>
                <Button variant="outlined" onPress={() => onOpenChange(false)}>
                  Close
                </Button>
              </YStack>
            ) : imageLoaded ? (
              <>
                <View
                  {...(Platform.OS === 'web'
                    ? { 'aria-live': 'polite', 'aria-atomic': 'true' }
                    : { accessibilityLiveRegion: 'polite' as const })}
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    left: -9999,
                    top: -9999,
                  }}
                >
                  <Text>{liveAnnouncement}</Text>
                </View>
                <Text fontSize="$3" color="$color11" text="center">
                  Drag to position • Scroll to zoom
                </Text>

                {renderControls()}

                {Platform.OS === 'web' ? (
                  <div
                    ref={containerRef}
                    style={{
                      position: 'relative',
                      width: displaySize,
                      height: displaySize,
                      backgroundColor: 'var(--color2)',
                      borderRadius: 'var(--radius-4)',
                      overflow: 'hidden',
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    role="img"
                    aria-label="Avatar crop area. Drag to reposition and scroll to zoom."
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    {imageRef.current && (
                      <img
                        src={imageUri}
                        alt="Crop preview"
                        style={{
                          position: 'absolute',
                          left: formatPixels(cropAreaTopLeft.x - cropPosition.x * scale),
                          top: formatPixels(cropAreaTopLeft.y - cropPosition.y * scale),
                          width: scaledImageWidth,
                          height: scaledImageHeight,
                          pointerEvents: 'none',
                          userSelect: 'none',
                          transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
                          transform: getWebTransform(
                            scaledImageWidth,
                            scaledImageHeight,
                            flipHorizontal,
                            flipVertical
                          ),
                        }}
                      />
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: formatPixels((displaySize - cropDisplaySize) / 2),
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: formatPixels((displaySize - cropDisplaySize) / 2),
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: formatPixels((displaySize - cropDisplaySize) / 2),
                        left: 0,
                        width: formatPixels((displaySize - cropDisplaySize) / 2),
                        height: formatPixels(cropDisplaySize),
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: formatPixels((displaySize - cropDisplaySize) / 2),
                        right: 0,
                        width: formatPixels((displaySize - cropDisplaySize) / 2),
                        height: formatPixels(cropDisplaySize),
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'none',
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: formatPixels(cropDisplaySize),
                        height: formatPixels(cropDisplaySize),
                        transform: 'translate(-50%, -50%)',
                        border: '2px solid var(--blue10)',
                        borderRadius: 'var(--radius-2)',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        zIndex: 10,
                      }}
                    />
                  </div>
                ) : null}

                <XStack gap="$3" width="100%">
                  <Dialog.Close asChild>
                    <Button flex={1} variant="outlined" disabled={isProcessing}>
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    flex={1}
                    theme="info"
                    onPress={handleSave}
                    icon={Check}
                    disabled={saveButtonDisabled}
                    opacity={saveButtonDisabled ? 0.6 : 1}
                  >
                    {isProcessing ? 'Processing…' : 'Save'}
                  </Button>
                </XStack>
              </>
            ) : (
              <YStack items="center" justify="center" minH={displaySize}>
                <Text>Loading image...</Text>
              </YStack>
            )}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
