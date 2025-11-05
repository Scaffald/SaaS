import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Platform } from 'react-native'
import {
  Dialog,
  Sheet,
  XStack,
  YStack,
  Text,
  Button,
  Image,
  View,
  useWindowDimensions,
} from 'tamagui'
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from '@tamagui/lucide-icons'

export interface AvatarCropModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void
  /** Source image URI */
  imageUri: string
  /** Callback with cropped image URI */
  onCropComplete: (croppedImageUri: string) => void
  /** Size of the crop area (square) */
  cropSize?: number
}

/**
 * AvatarCropModal Component
 *
 * A cross-platform modal for cropping avatar images into a square format.
 * - Web: Uses canvas API for image cropping with zoom and drag controls
 * - Native: Basic UI (enhance with expo-image-manipulator when available)
 *
 * @example
 * ```tsx
 * <AvatarCropModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   imageUri={selectedImageUri}
 *   onCropComplete={(croppedUri) => {
 *     // Handle cropped image
 *   }}
 * />
 * ```
 */
export function AvatarCropModal({
  open,
  onOpenChange,
  imageUri,
  onCropComplete,
  cropSize = 300,
}: AvatarCropModalProps) {
  const { width, height } = useWindowDimensions()
  const isMobile = width < 768
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1) // Zoom level (1 = 100%)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Larger modal size
  const maxDisplaySize = isMobile
    ? Math.min(width - 64, height - 200)
    : Math.min(600, width - 128, height - 200)
  const displaySize = Math.max(400, Math.min(maxDisplaySize, cropSize * 1.5))

  // Load image and get dimensions
  useEffect(() => {
    if (!imageUri || !open) {
      setImageLoaded(false)
      setZoom(1)
      setCropPosition({ x: 0, y: 0 })
      return
    }

    if (Platform.OS !== 'web') {
      // For native, just mark as loaded
      setImageLoaded(true)
      return
    }

    const img = document.createElement('img')
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight
      setImageDimensions({ width: imgWidth, height: imgHeight })

      // Initialize zoom to fit image in display area
      const baseScale = displaySize / Math.max(imgWidth, imgHeight)
      const initialZoom = Math.max(1, baseScale * 1.2) // Start slightly zoomed in
      setZoom(initialZoom)

      // Initialize crop position to center
      const initialCropSize = Math.min(imgWidth, imgHeight, cropSize)
      setCropPosition({
        x: Math.max(0, (imgWidth - initialCropSize) / 2),
        y: Math.max(0, (imgHeight - initialCropSize) / 2),
      })

      setImageLoaded(true)
      imageRef.current = img
    }

    img.onerror = () => {
      console.error('Failed to load image for cropping')
      setImageLoaded(false)
    }

    img.src = imageUri
  }, [imageUri, open, cropSize, displaySize])

  // Calculate actual crop size (can't exceed image dimensions)
  const actualCropSize =
    imageDimensions.width > 0 && imageDimensions.height > 0
      ? Math.min(imageDimensions.width, imageDimensions.height, cropSize)
      : cropSize

  // Base scale to fit image in display area
  const baseScale =
    imageDimensions.width > 0 && imageDimensions.height > 0
      ? displaySize / Math.max(imageDimensions.width, imageDimensions.height)
      : 1

  // Final scale with zoom applied
  const scale = baseScale * zoom

  const scaledImageWidth = imageDimensions.width * scale
  const scaledImageHeight = imageDimensions.height * scale

  // Crop area display size should be fixed (based on baseScale, not zoom)
  // This ensures the crop box stays the same size while only the image zooms
  const cropDisplaySize = actualCropSize * baseScale

  // Calculate crop area's top-left corner (crop area is centered in container)
  const cropAreaTopLeft = useMemo(() => {
    const cropAreaTopLeftX = displaySize / 2 - cropDisplaySize / 2
    const cropAreaTopLeftY = displaySize / 2 - cropDisplaySize / 2
    return { x: cropAreaTopLeftX, y: cropAreaTopLeftY }
  }, [displaySize, cropDisplaySize])

  const cropAreaTopLeftX = cropAreaTopLeft.x
  const cropAreaTopLeftY = cropAreaTopLeft.y

  // Calculate max crop position to ensure crop area stays within image bounds
  const getMaxCropPosition = useCallback(() => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return { maxX: 0, maxY: 0 }
    }
    return {
      maxX: Math.max(0, imageDimensions.width - actualCropSize),
      maxY: Math.max(0, imageDimensions.height - actualCropSize),
    }
  }, [imageDimensions, actualCropSize])

  // Constrain crop position to image boundaries
  const constrainCropPosition = useCallback(
    (x: number, y: number) => {
      const { maxX, maxY } = getMaxCropPosition()
      return {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
      }
    },
    [getMaxCropPosition]
  )

  // Zoom controls
  const minZoom = 0.5
  const maxZoom = 3

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.min(maxZoom, prev * 1.2)
      // Constrain crop position after zoom
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      return newZoom
    })
  }, [maxZoom, constrainCropPosition])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(minZoom, prev / 1.2)
      // Constrain crop position after zoom
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
      return newZoom
    })
  }, [minZoom, constrainCropPosition])

  const handleZoomReset = useCallback(() => {
    const baseScale =
      imageDimensions.width > 0 && imageDimensions.height > 0
        ? displaySize / Math.max(imageDimensions.width, imageDimensions.height)
        : 1
    setZoom(Math.max(1, baseScale * 1.2))
    // Reset crop position to center
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      const initialCropSize = Math.min(imageDimensions.width, imageDimensions.height, cropSize)
      setCropPosition({
        x: Math.max(0, (imageDimensions.width - initialCropSize) / 2),
        y: Math.max(0, (imageDimensions.height - initialCropSize) / 2),
      })
    }
  }, [imageDimensions, displaySize, cropSize])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Platform.OS !== 'web' || !imageLoaded) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => {
        const newZoom = Math.max(minZoom, Math.min(maxZoom, prev * delta))
        // Constrain crop position after zoom
        setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
        return newZoom
      })
    },
    [imageLoaded, minZoom, maxZoom, constrainCropPosition]
  )

  // Handle crop
  const handleCrop = useCallback(() => {
    if (Platform.OS === 'web' && canvasRef.current && imageLoaded && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx || !imageRef.current) return

      // Ensure crop position is within bounds
      const constrained = constrainCropPosition(cropPosition.x, cropPosition.y)

      // Set canvas size to desired crop size
      canvas.width = cropSize
      canvas.height = cropSize

      // Draw cropped portion of image
      ctx.drawImage(
        imageRef.current,
        constrained.x,
        constrained.y,
        actualCropSize,
        actualCropSize,
        0,
        0,
        cropSize,
        cropSize
      )

      // Convert to blob URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedUri = URL.createObjectURL(blob)
            onCropComplete(croppedUri)
            onOpenChange(false)
          }
        },
        'image/jpeg',
        0.95
      )
    } else {
      // Native: For now, return original image URI
      console.warn(
        'Native image cropping not yet implemented. Install expo-image-manipulator for full support.'
      )
      onCropComplete(imageUri)
      onOpenChange(false)
    }
  }, [
    imageUri,
    cropPosition,
    actualCropSize,
    cropSize,
    imageLoaded,
    onCropComplete,
    onOpenChange,
    constrainCropPosition,
  ])

  // Smooth drag handling with requestAnimationFrame
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (Platform.OS !== 'web' || !containerRef.current) return
      e.preventDefault()
      setIsDragging(true)

      const rect = containerRef.current.getBoundingClientRect()

      // Calculate mouse position relative to crop area's top-left corner
      const mouseXInContainer = e.clientX - rect.left
      const mouseYInContainer = e.clientY - rect.top

      // Convert to image coordinates (subtract crop area offset, then divide by scale)
      const mouseXInImage = (mouseXInContainer - cropAreaTopLeftX) / scale
      const mouseYInImage = (mouseYInContainer - cropAreaTopLeftY) / scale

      // Store the offset from current crop position
      setDragStart({
        x: mouseXInImage - cropPosition.x,
        y: mouseYInImage - cropPosition.y,
      })
    },
    [cropPosition, scale, cropAreaTopLeftX, cropAreaTopLeftY]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || Platform.OS !== 'web' || !containerRef.current) return
      e.preventDefault()

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()

        // Calculate mouse position relative to crop area's top-left corner
        const mouseXInContainer = e.clientX - rect.left
        const mouseYInContainer = e.clientY - rect.top

        // Convert to image coordinates (subtract crop area offset, then divide by scale)
        const mouseXInImage = (mouseXInContainer - cropAreaTopLeftX) / scale
        const mouseYInImage = (mouseYInContainer - cropAreaTopLeftY) / scale

        // Calculate new crop position (subtract the drag offset we stored)
        const newX = mouseXInImage - dragStart.x
        const newY = mouseYInImage - dragStart.y

        // Constrain to image boundaries
        const constrained = constrainCropPosition(newX, newY)

        setCropPosition(constrained)
      })
    },
    [isDragging, scale, dragStart, constrainCropPosition, cropAreaTopLeftX, cropAreaTopLeftY]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Ensure crop position stays within bounds when zoom or dimensions change
  useEffect(() => {
    if (imageLoaded && imageDimensions.width > 0 && imageDimensions.height > 0) {
      setCropPosition((pos) => constrainCropPosition(pos.x, pos.y))
    }
  }, [zoom, imageDimensions, imageLoaded, constrainCropPosition])

  // Mobile: Render as Sheet
  if (isMobile) {
    return (
      <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[90]} dismissOnSnapToBottom>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame bg="$background">
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
            <Button size="$3" circular chromeless icon={X} onPress={() => onOpenChange(false)} />
          </XStack>

          <YStack p="$4" gap="$4" flex={1}>
            {imageLoaded ? (
              <YStack flex={1} items="center" justify="center" gap="$4">
                <Text fontSize="$3" color="$color11" textAlign="center">
                  Image cropping on mobile requires expo-image-manipulator. Using original image for
                  now.
                </Text>
                <Image
                  source={{ uri: imageUri }}
                  width={displaySize}
                  height={displaySize}
                  contentFit="contain"
                  borderRadius="$4"
                />
                <XStack gap="$3" w="100%">
                  <Button flex={1} variant="outlined" onPress={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button flex={1} theme="blue" onPress={handleCrop} icon={Check}>
                    Use Image
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

  // Desktop: Render as Dialog
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
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
              <Button size="$3" circular chromeless icon={X} />
            </Dialog.Close>
          </XStack>

          <YStack p="$4" gap="$4" items="center">
            {imageLoaded ? (
              <>
                <Text fontSize="$3" color="$color11" textAlign="center">
                  Drag to position • Scroll to zoom
                </Text>

                {/* Zoom controls */}
                <XStack gap="$2" items="center">
                  <Button
                    size="$2"
                    icon={ZoomOut}
                    onPress={handleZoomOut}
                    disabled={zoom <= minZoom}
                    variant="outlined"
                  />
                  <Text fontSize="$2" color="$color11" minWidth={60} textAlign="center">
                    {Math.round(zoom * 100)}%
                  </Text>
                  <Button
                    size="$2"
                    icon={ZoomIn}
                    onPress={handleZoomIn}
                    disabled={zoom >= maxZoom}
                    variant="outlined"
                  />
                  <Button size="$2" icon={RotateCcw} onPress={handleZoomReset} variant="outlined">
                    Reset
                  </Button>
                </XStack>

                {/* @ts-ignore - ref for web drag handling */}
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
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  {/* Hidden canvas for cropping */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Image */}
                  {imageRef.current && (
                    <img
                      src={imageUri}
                      alt="Crop preview"
                      style={{
                        position: 'absolute',
                        // Position image so its top-left corner aligns with crop area's top-left
                        // when cropPosition is (0, 0)
                        left: `${cropAreaTopLeftX - cropPosition.x * scale}px`,
                        top: `${cropAreaTopLeftY - cropPosition.y * scale}px`,
                        width: scaledImageWidth,
                        height: scaledImageHeight,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out',
                      }}
                    />
                  )}

                  {/* Crop overlay border - fixed size */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: cropDisplaySize,
                      height: cropDisplaySize,
                      transform: 'translate(-50%, -50%)',
                      border: '2px solid var(--blue10)',
                      borderRadius: 'var(--radius-2)',
                      pointerEvents: 'none',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      zIndex: 10,
                    }}
                  />

                  {/* Dark overlay outside crop area - fixed size */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      pointerEvents: 'none',
                      clipPath: `circle(${cropDisplaySize / 2}px at 50% 50%)`,
                      WebkitClipPath: `circle(${cropDisplaySize / 2}px at 50% 50%)`,
                    }}
                  />
                </div>

                <XStack gap="$3" w="100%">
                  <Dialog.Close asChild>
                    <Button flex={1} variant="outlined">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button flex={1} theme="blue" onPress={handleCrop} icon={Check}>
                    Crop & Use
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
