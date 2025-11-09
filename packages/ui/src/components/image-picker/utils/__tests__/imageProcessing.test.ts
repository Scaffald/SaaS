import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

import { processCroppedImage } from '../imageProcessing'

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
    toBlob: Mock<[(blob: Blob | null) => void, string], void>
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
      toBlob: vi.fn((callback: (blob: Blob | null) => void, mime: string) => {
        const fakeBlob = {
          type: mime,
          size: 4,
          async arrayBuffer() {
            return new Uint8Array([0, 1, 2, 3]).buffer
          },
        }
        callback(fakeBlob as unknown as Blob)
      }) as Mock<[(blob: Blob | null) => void, string], void>,
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
    expect(ctxMock.drawImage).toHaveBeenCalledWith(expect.anything(), 10, 20, 200, 220, 0, 0, 200, 200)
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
})

