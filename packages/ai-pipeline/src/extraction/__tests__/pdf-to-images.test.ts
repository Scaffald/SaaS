import { describe, it, expect } from 'vitest';
import { convertPdfToImages, type PageImage } from '../pdf-to-images.js';

/**
 * Build a minimal valid single-page PDF with correct xref byte offsets.
 * This avoids needing fixture files while still producing a parseable PDF.
 */
function createMinimalPdf(): Buffer {
  // Build the PDF piece by piece so we can calculate exact byte offsets.
  const lines: string[] = [];

  lines.push('%PDF-1.0');

  const obj1Offset = lines.join('\n').length + 1; // +1 for the upcoming newline
  lines.push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj');

  const obj2Offset = lines.join('\n').length + 1;
  lines.push('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj');

  const obj3Offset = lines.join('\n').length + 1;
  lines.push('3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj');

  const xrefOffset = lines.join('\n').length + 1;

  // Pad offsets to 10-digit format per PDF spec
  const pad = (n: number) => n.toString().padStart(10, '0');

  lines.push('xref');
  lines.push('0 4');
  lines.push(`${pad(0)} 65535 f `);
  lines.push(`${pad(obj1Offset)} 00000 n `);
  lines.push(`${pad(obj2Offset)} 00000 n `);
  lines.push(`${pad(obj3Offset)} 00000 n `);
  lines.push('trailer<</Size 4/Root 1 0 R>>');
  lines.push('startxref');
  lines.push(String(xrefOffset));
  lines.push('%%EOF');

  return Buffer.from(lines.join('\n'));
}

describe('convertPdfToImages', () => {
  it('converts a single-page PDF to one base64 PNG image', async () => {
    const pdf = createMinimalPdf();
    const images = await convertPdfToImages(pdf);

    expect(images).toHaveLength(1);
    expect(images[0].pageNumber).toBe(1);
    expect(images[0].base64).toBeTruthy();
    // Verify it is valid base64 by round-tripping
    expect(() => Buffer.from(images[0].base64, 'base64')).not.toThrow();
  });

  it('returns PageImage objects with required fields', async () => {
    const pdf = createMinimalPdf();
    const images = await convertPdfToImages(pdf);
    const img: PageImage = images[0];

    expect(img).toHaveProperty('pageNumber');
    expect(img).toHaveProperty('base64');
    expect(typeof img.pageNumber).toBe('number');
    expect(typeof img.base64).toBe('string');
  });

  it('produces a valid PNG (starts with PNG magic bytes)', async () => {
    const pdf = createMinimalPdf();
    const images = await convertPdfToImages(pdf);
    const pngBuffer = Buffer.from(images[0].base64, 'base64');

    // PNG files start with the 8-byte signature: 137 80 78 71 13 10 26 10
    expect(pngBuffer[0]).toBe(137);
    expect(pngBuffer[1]).toBe(80); // 'P'
    expect(pngBuffer[2]).toBe(78); // 'N'
    expect(pngBuffer[3]).toBe(71); // 'G'
  });

  it('throws on invalid input', async () => {
    await expect(convertPdfToImages(Buffer.from('not a pdf'))).rejects.toThrow();
  });
});
