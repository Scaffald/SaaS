// Note: unpdf is only available in Deno edge functions
// This file should only be used in edge function context
import { extractText as extractTextWithUnpdf } from 'unpdf'

type ExtractSource = 'unpdf' | 'fallback'

export interface PdfExtractionResult {
  text: string
  pageTexts: string[]
  totalPages: number
  source: ExtractSource
}

export interface ExtractTextFromPdfOptions {
  namespace?: string
}

const textDecoder = new TextDecoder('utf-8', { fatal: false })

/**
 * Extracts textual content from a PDF using the unpdf library, with a
 * TextDecoder fallback for edge cases where the structured extraction fails.
 */
export async function extractTextFromPdf(
  fileBytes: Uint8Array,
  options: ExtractTextFromPdfOptions = {}
): Promise<PdfExtractionResult> {
  const namespace = options.namespace ?? 'pdf'

  try {
    const { text: pageTexts, totalPages } = await extractTextWithUnpdf(fileBytes, {
      mergePages: false,
    })

    const normalizedPages = pageTexts.map((page: string | undefined) => page?.trim() ?? '')
    const combinedText = normalizedPages.join('\n').trim()

    if (combinedText.length > 0) {
      return {
        text: combinedText,
        pageTexts: normalizedPages,
        totalPages,
        source: 'unpdf',
      }
    }

    logWarning(namespace, 'unpdf returned empty text', {
      fileSize: fileBytes.length,
      totalPages,
    })
  } catch (error) {
    logWarning(namespace, 'unpdf extraction failed', {
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      fileSize: fileBytes.length,
    })
  }

  const fallbackText = decodeWithTextDecoder(fileBytes)
  return {
    text: fallbackText,
    pageTexts: fallbackText.length > 0 ? [fallbackText] : [],
    totalPages: 1,
    source: 'fallback',
  }
}

function decodeWithTextDecoder(bytes: Uint8Array): string {
  try {
    return textDecoder.decode(bytes).trim()
  } catch (error) {
    logWarning('pdf', 'TextDecoder fallback failed', {
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      fileSize: bytes.length,
    })
    return ''
  }
}

function logWarning(namespace: string, message: string, details: Record<string, unknown>) {
  console.warn(`[${namespace}] ${message}`, details)
}
