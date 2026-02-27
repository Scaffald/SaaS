/**
 * POC CLI: Extract structured data from a single ACORD PDF.
 *
 * Usage:
 *   pnpm --filter @scf/ai-pipeline poc:extract <path-to-pdf>
 *   pnpm --filter @scf/ai-pipeline poc:extract poc/fixtures/input/sample.pdf
 */
import { config } from 'dotenv';
config({ path: new URL('../../../.env', import.meta.url).pathname });
import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { convertPdfToImages } from '../src/extraction/pdf-to-images.js';
import { AIExtractionService } from '../src/ai/openai-client.js';
import { ACORD25_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts/acord25.js';

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: pnpm --filter @scf/ai-pipeline poc:extract <path-to-pdf>');
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not set. Add it to your root .env file.');
    process.exit(1);
  }

  const resolvedPath = resolve(pdfPath);
  const fileName = basename(resolvedPath);

  console.error('\n--- ACORD Extraction POC ---');
  console.error(`File: ${fileName}`);
  console.error(`Prompt: ${PROMPT_VERSION}`);
  console.error('Model: gpt-4o');
  console.error('---');

  // 1. Read PDF
  console.error('Reading PDF...');
  const pdfBuffer = readFileSync(resolvedPath);
  console.error(`PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // 2. Convert to images
  console.error('Converting to images...');
  const pages = await convertPdfToImages(pdfBuffer);
  console.error(`Pages: ${pages.length}`);

  // 3. Extract via GPT-4o Vision
  console.error('Sending to GPT-4o Vision...');
  const service = new AIExtractionService(apiKey);
  const result = await service.extractCertificate(pages, ACORD25_SYSTEM_PROMPT);

  // 4. Print metadata to stderr (so JSON output on stdout is clean)
  console.error('\n--- Results ---');
  console.error(`Confidence: ${result.data.extraction_confidence}%`);
  console.error(`Coverages found: ${result.data.coverages.length}`);
  console.error(`Endorsements found: ${result.data.endorsements.length}`);
  console.error(`Fields requiring review: ${result.data.fields_requiring_review.length > 0 ? result.data.fields_requiring_review.join(', ') : 'none'}`);
  if (result.data.extraction_notes.length > 0) {
    console.error(`Notes: ${result.data.extraction_notes.join('; ')}`);
  }
  console.error(`Duration: ${result.duration_ms}ms`);
  if (result.usage) {
    console.error(`Tokens: ${result.usage.prompt_tokens} in / ${result.usage.completion_tokens} out / ${result.usage.total_tokens} total`);
    // Rough cost estimate for GPT-4o: $2.50/1M input, $10/1M output
    const cost = (result.usage.prompt_tokens * 2.5 + result.usage.completion_tokens * 10) / 1_000_000;
    console.error(`Est. cost: $${cost.toFixed(4)}`);
  }
  console.error('---\n');

  // 5. Print structured JSON to stdout (pipe-friendly)
  console.log(JSON.stringify(result.data, null, 2));
}

main().catch((err) => {
  console.error('Extraction failed:', err.message || err);
  process.exit(1);
});
