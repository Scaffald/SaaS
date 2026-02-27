import { pdfToPng } from 'pdf-to-png-converter';

export interface PageImage {
  pageNumber: number;
  base64: string;
}

/**
 * Converts PDF buffer to base64-encoded PNG images, one per page.
 * Uses pdf-to-png-converter (pure JS, no native dependencies).
 *
 * @param pdfBuffer - Raw PDF file as Buffer
 * @returns Array of PageImage objects with base64 PNG strings
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
  const pngPages = await pdfToPng(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength), {
    viewportScale: 1.5, // ~150 DPI (balances quality vs token cost for GPT-4o Vision)
  });

  if (!pngPages || pngPages.length === 0) {
    throw new Error('PDF conversion produced no images — file may be corrupt or empty');
  }

  return pngPages.map((page) => ({
    pageNumber: page.pageNumber,
    base64: page.content!.toString('base64'),
  }));
}
