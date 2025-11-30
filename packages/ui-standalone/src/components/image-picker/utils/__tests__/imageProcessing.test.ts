import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { processCroppedImage } from '../imageProcessing'

type ToBlobFn = (callback: (blob: Blob | null) => void, mime: string, quality?: number) => void

describe('processCroppedImage (web)', () => {
  const OriginalImage = globalThis.Image
  let restoreCreateElement: (() => void) | undefined
  let ctxMock: {
    drawImage: ReturnType<typeof vi.fn>
    save: ReturnType<typeof vi.fn>
    restore: ReturnType<typeof vi.fn>
    scale: ReturnType<typeof vi.fn>
    translate: ReturnType<typeof vi.fn>
  }
  let canvasMock: {
    width: number
    height: number
    getContext: ReturnType<typeof vi.fn>
    toBlob: ToBlobFn
  }

  beforeEach(() => {
    ctxMock = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
    }

    canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(ctxMock),
      toBlob: vi.fn((callback: (blob: Blob | null) => void, mime: string, _quality?: number) => {
        const fakeBlob = {
          type: mime,
          size: 4,
          async arrayBuffer() {
            return new Uint8Array([0, 1, 2, 3]).buffer
          },
        }
        callback(fakeBlob as unknown as Blob)
      }) as ToBlobFn,
    }

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return canvasMock as unknown as HTMLCanvasElement
        }

        throw new Error(`Unexpected element requested: ${tagName}`)
      })

    restoreCreateElement = () => createElementSpy.mockRestore()

    class MockImage {
      naturalWidth = 800
      naturalHeight = 600
      onload?: () => void
      onerror?: () => void
      crossOrigin = ''

      set src(_value: string) {
        this.onload?.()
      }
    }

    // @ts-expect-error - we are stubbing the global for testing
    globalThis.Image = MockImage
  })

  afterEach(() => {
    restoreCreateElement?.()
    vi.clearAllMocks()

    if (OriginalImage) {
      globalThis.Image = OriginalImage
    } else {
      // @ts-expect-error - cleanup stubbed global
      delete globalThis.Image
    }
  })

  it('returns a processed image with expected dimensions', async () => {
    const result = await processCroppedImage({
      imageSrc: 'data:image/jpeg;base64,AAAA',
      crop: { originX: 10, originY: 20, width: 200, height: 220 },
      imageWidth: 800,
      imageHeight: 600,
    })

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.width).toBe(200)
    expect(result.height).toBe(200)
    expect(result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)

    expect(canvasMock.width).toBe(200)
    expect(canvasMock.height).toBe(200)
    expect(ctxMock.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      10,
      20,
      200,
      220,
      0,
      0,
      200,
      200
    )
  })

  it('applies flip transformations', async () => {
    await processCroppedImage({
      imageSrc: 'data:image/png;base64,BBBB',
      crop: { originX: 0, originY: 0, width: 300, height: 300 },
      imageWidth: 600,
      imageHeight: 600,
      flipHorizontal: true,
      flipVertical: true,
    })

    expect(ctxMock.translate).toHaveBeenCalledWith(300, 300)
    expect(ctxMock.scale).toHaveBeenCalledWith(-1, -1)
  })

  describe('Compression and Size Limits', () => {
    it('reduces quality when JPEG exceeds size limit', async () => {
      let callCount = 0
      canvasMock.toBlob = vi.fn(
        (callback: (blob: Blob | null) => void, mime: string, _quality?: number) => {
          callCount++
          // First call: large blob (600KB)
          if (callCount === 1) {
            const largeBlob = {
              type: mime,
              size: 600 * 1024, // 600KB
              async arrayBuffer() {
                return new Uint8Array(600 * 1024).buffer
              },
            }
            callback(largeBlob as unknown as Blob)
          } else {
            // Subsequent calls: smaller blob
            const smallBlob = {
              type: mime,
              size: 400 * 1024, // 400KB
              async arrayBuffer() {
                return new Uint8Array(400 * 1024).buffer
              },
            }
            callback(smallBlob as unknown as Blob)
          }
        }
      ) as ToBlobFn

      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 512, height: 512 },
        imageWidth: 1024,
        imageHeight: 1024,
        mimeType: 'image/jpeg',
        maxBytes: 500 * 1024,
      })

      // Should have called toBlob multiple times to reduce quality
      expect(callCount).toBeGreaterThan(1)
      expect(result.size).toBeLessThanOrEqual(500 * 1024)
    })

    it('converts PNG to JPEG when PNG exceeds size limit', async () => {
      let callCount = 0
      canvasMock.toBlob = vi.fn((callback: (blob: Blob | null) => void, mime: string) => {
        callCount++
        if (mime === 'image/png') {
          // PNG is too large
          const largeBlob = {
            type: 'image/png',
            size: 600 * 1024,
            async arrayBuffer() {
              return new Uint8Array(600 * 1024).buffer
            },
          }
          callback(largeBlob as unknown as Blob)
        } else {
          // JPEG is smaller
          const smallBlob = {
            type: 'image/jpeg',
            size: 400 * 1024,
            async arrayBuffer() {
              return new Uint8Array(400 * 1024).buffer
            },
          }
          callback(smallBlob as unknown as Blob)
        }
      }) as ToBlobFn

      const result = await processCroppedImage({
        imageSrc: 'data:image/png;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 512, height: 512 },
        imageWidth: 1024,
        imageHeight: 1024,
        mimeType: 'image/png',
        maxBytes: 500 * 1024,
      })

      // Should have converted to JPEG
      expect(result.mimeType).toBe('image/jpeg')
      expect(result.size).toBeLessThanOrEqual(500 * 1024)
    })

    it('converts WebP to JPEG when WebP exceeds size limit', async () => {
      let callCount = 0
      canvasMock.toBlob = vi.fn((callback: (blob: Blob | null) => void, mime: string) => {
        callCount++
        if (mime === 'image/webp') {
          const largeBlob = {
            type: 'image/webp',
            size: 600 * 1024,
            async arrayBuffer() {
              return new Uint8Array(600 * 1024).buffer
            },
          }
          callback(largeBlob as unknown as Blob)
        } else {
          const smallBlob = {
            type: 'image/jpeg',
            size: 400 * 1024,
            async arrayBuffer() {
              return new Uint8Array(400 * 1024).buffer
            },
          }
          callback(smallBlob as unknown as Blob)
        }
      }) as ToBlobFn

      const result = await processCroppedImage({
        imageSrc: 'data:image/webp;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 512, height: 512 },
        imageWidth: 1024,
        imageHeight: 1024,
        mimeType: 'image/webp',
        maxBytes: 500 * 1024,
      })

      expect(result.mimeType).toBe('image/jpeg')
      expect(result.size).toBeLessThanOrEqual(500 * 1024)
    })

    it('stops quality reduction at quality floor', async () => {
      let quality = 0.85
      canvasMock.toBlob = vi.fn(
        (callback: (blob: Blob | null) => void, mime: string, q?: number) => {
          quality = q ?? 0.85
          // Always return large blob to force quality reduction
          const largeBlob = {
            type: mime,
            size: 600 * 1024,
            async arrayBuffer() {
              return new Uint8Array(600 * 1024).buffer
            },
          }
          callback(largeBlob as unknown as Blob)
        }
      ) as ToBlobFn

      await expect(
        processCroppedImage({
          imageSrc: 'data:image/jpeg;base64,AAAA',
          crop: { originX: 0, originY: 0, width: 512, height: 512 },
          imageWidth: 1024,
          imageHeight: 1024,
          mimeType: 'image/jpeg',
          maxBytes: 500 * 1024,
        })
      ).rejects.toThrow('Processed image exceeds 500KB after compression.')

      // Should have tried reducing quality down to floor (0.5)
      expect(quality).toBeLessThanOrEqual(0.5)
    })
  })

  describe('Edge Cases', () => {
    it('handles very small images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 100, height: 100 },
        imageWidth: 200,
        imageHeight: 200,
      })

      expect(result.width).toBe(100)
      expect(result.height).toBe(100)
    })

    it('handles square images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 512, height: 512 },
        imageWidth: 1024,
        imageHeight: 1024,
      })

      expect(result.width).toBe(512)
      expect(result.height).toBe(512)
    })

    it('handles rectangular images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 400, height: 300 },
        imageWidth: 800,
        imageHeight: 600,
      })

      // Should use the smaller dimension
      expect(result.width).toBe(300)
      expect(result.height).toBe(300)
    })

    it('clamps crop boundaries when crop exceeds image bounds', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 700, originY: 500, width: 200, height: 200 }, // Exceeds 800x600 image
        imageWidth: 800,
        imageHeight: 600,
      })

      // Should clamp the crop to fit within image bounds
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('handles crop with negative coordinates', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: -10, originY: -20, width: 200, height: 200 },
        imageWidth: 800,
        imageHeight: 600,
      })

      // Should clamp negative coordinates to 0
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('handles crop larger than image', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 2000, height: 2000 },
        imageWidth: 800,
        imageHeight: 600,
      })

      // Should clamp to image dimensions
      expect(result.width).toBeLessThanOrEqual(800)
      expect(result.height).toBeLessThanOrEqual(600)
    })
  })

  describe('MIME Type Handling', () => {
    it('processes JPEG images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 300, height: 300 },
        imageWidth: 600,
        imageHeight: 600,
        mimeType: 'image/jpeg',
      })

      expect(result.mimeType).toBe('image/jpeg')
      expect(result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
    })

    it('processes PNG images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/png;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 300, height: 300 },
        imageWidth: 600,
        imageHeight: 600,
        mimeType: 'image/png',
      })

      expect(result.mimeType).toBe('image/png')
      expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    })

    it('processes WebP images', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/webp;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 300, height: 300 },
        imageWidth: 600,
        imageHeight: 600,
        mimeType: 'image/webp',
      })

      expect(result.mimeType).toBe('image/webp')
      expect(result.dataUrl.startsWith('data:image/webp;base64,')).toBe(true)
    })

    it('defaults to JPEG for unsupported MIME types', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/gif;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 300, height: 300 },
        imageWidth: 600,
        imageHeight: 600,
        mimeType: 'image/gif',
      })

      expect(result.mimeType).toBe('image/jpeg')
    })
  })

  describe('Error Handling', () => {
    it('throws error when canvas context is unavailable', async () => {
      canvasMock.getContext = vi.fn().mockReturnValue(null)

      await expect(
        processCroppedImage({
          imageSrc: 'data:image/jpeg;base64,AAAA',
          crop: { originX: 0, originY: 0, width: 300, height: 300 },
          imageWidth: 600,
          imageHeight: 600,
        })
      ).rejects.toThrow('Unable to access canvas context')
    })

    it('throws error when blob generation fails', async () => {
      canvasMock.toBlob = vi.fn(
        (callback: (blob: Blob | null) => void, _mime?: string, _quality?: number) => {
          callback(null) // Simulate blob generation failure
        }
      ) as ToBlobFn

      await expect(
        processCroppedImage({
          imageSrc: 'data:image/jpeg;base64,AAAA',
          crop: { originX: 0, originY: 0, width: 300, height: 300 },
          imageWidth: 600,
          imageHeight: 600,
        })
      ).rejects.toThrow('Failed to generate image blob')
    })

    it('throws error when image load fails', async () => {
      class FailingImage {
        onload?: () => void
        onerror?: (err: unknown) => void
        crossOrigin = ''
        naturalWidth = 0
        naturalHeight = 0

        set src(_value: string) {
          // Simulate async error
          setTimeout(() => {
            this.onerror?.(new Error('Failed to load image'))
          }, 0)
        }
      }

      // @ts-expect-error - stubbing global
      globalThis.Image = FailingImage

      await expect(
        processCroppedImage({
          imageSrc: 'data:image/jpeg;base64,invalid',
          crop: { originX: 0, originY: 0, width: 300, height: 300 },
          imageWidth: 600,
          imageHeight: 600,
        })
      ).rejects.toThrow()
    })
  })

  describe('Target Size Handling', () => {
    it('uses custom target size when provided', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 800, height: 800 },
        imageWidth: 1600,
        imageHeight: 1600,
        targetSize: 256,
      })

      expect(result.width).toBe(256)
      expect(result.height).toBe(256)
      expect(canvasMock.width).toBe(256)
      expect(canvasMock.height).toBe(256)
    })

    it('uses crop size when smaller than target size', async () => {
      const result = await processCroppedImage({
        imageSrc: 'data:image/jpeg;base64,AAAA',
        crop: { originX: 0, originY: 0, width: 200, height: 200 },
        imageWidth: 800,
        imageHeight: 600,
        targetSize: 512,
      })

      expect(result.width).toBe(200)
      expect(result.height).toBe(200)
    })
  })
})
