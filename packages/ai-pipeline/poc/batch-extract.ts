/**
 * POC CLI: Batch-extract all PDFs in fixtures/input/, save results to fixtures/results/.
 *
 * Usage:
 *   pnpm --filter @scf/ai-pipeline poc:batch
 */
import { config } from 'dotenv';
config({ path: new URL('../../../.env', import.meta.url).pathname });
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertPdfToImages } from '../src/extraction/pdf-to-images.js';
import { AIExtractionService } from '../src/ai/openai-client.js';
import { ACORD25_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts/acord25.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = resolve(__dirname, 'fixtures/input');
const RESULTS_DIR = resolve(__dirname, 'fixtures/results');

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not set. Add it to your root .env file.');
    process.exit(1);
  }

  // Find all PDFs in input/
  let files: string[];
  try {
    files = readdirSync(INPUT_DIR).filter(
      (f) => extname(f).toLowerCase() === '.pdf',
    );
  } catch {
    console.error(`No input directory found at ${INPUT_DIR}`);
    console.error('Create it and drop your ACORD PDFs there.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No PDF files found in ${INPUT_DIR}`);
    process.exit(1);
  }

  // Ensure results directory exists
  mkdirSync(RESULTS_DIR, { recursive: true });

  console.log('\n=== ACORD Batch Extraction ===');
  console.log(`Prompt: ${PROMPT_VERSION}`);
  console.log('Model: gpt-4o');
  console.log(`Documents: ${files.length}`);
  console.log('=============================\n');

  const service = new AIExtractionService(apiKey);
  const summary: Array<{
    file: string;
    confidence: number;
    coverages: number;
    endorsements: number;
    review_fields: string[];
    duration_ms: number;
    cost_estimate: number;
    error?: string;
  }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = join(INPUT_DIR, file);
    const resultName = `${basename(file, extname(file))}.json`;
    const resultPath = join(RESULTS_DIR, resultName);

    console.log(`[${i + 1}/${files.length}] ${file}`);

    try {
      const pdfBuffer = readFileSync(filePath);
      const pages = await convertPdfToImages(pdfBuffer);
      const result = await service.extractCertificate(pages, ACORD25_SYSTEM_PROMPT);

      // Save result
      writeFileSync(resultPath, JSON.stringify(result.data, null, 2));

      const costEstimate = result.usage
        ? (result.usage.prompt_tokens * 2.5 + result.usage.completion_tokens * 10) / 1_000_000
        : 0;

      summary.push({
        file,
        confidence: result.data.extraction_confidence,
        coverages: result.data.coverages.length,
        endorsements: result.data.endorsements.length,
        review_fields: result.data.fields_requiring_review,
        duration_ms: result.duration_ms,
        cost_estimate: costEstimate,
      });

      console.log(`  > Confidence: ${result.data.extraction_confidence}% | Coverages: ${result.data.coverages.length} | Endorsements: ${result.data.endorsements.length} | ${result.duration_ms}ms | $${costEstimate.toFixed(4)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.push({
        file,
        confidence: 0,
        coverages: 0,
        endorsements: 0,
        review_fields: [],
        duration_ms: 0,
        cost_estimate: 0,
        error: message,
      });
      console.log(`  x ERROR: ${message}`);
    }
  }

  // Print summary
  const succeeded = summary.filter((s) => !s.error);
  const failed = summary.filter((s) => s.error);
  const totalCost = summary.reduce((sum, s) => sum + s.cost_estimate, 0);
  const avgConfidence = succeeded.length > 0
    ? succeeded.reduce((sum, s) => sum + s.confidence, 0) / succeeded.length
    : 0;

  console.log('\n=== Batch Summary ===');
  console.log(`Succeeded: ${succeeded.length}/${files.length}`);
  console.log(`Failed: ${failed.length}/${files.length}`);
  console.log(`Avg confidence: ${avgConfidence.toFixed(1)}%`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Results saved to: ${RESULTS_DIR}`);

  if (failed.length > 0) {
    console.log('\nFailed documents:');
    for (const f of failed) {
      console.log(`  - ${f.file}: ${f.error}`);
    }
  }

  // Save summary
  writeFileSync(
    join(RESULTS_DIR, '_summary.json'),
    JSON.stringify({ prompt_version: PROMPT_VERSION, model: 'gpt-4o', run_date: new Date().toISOString(), summary }, null, 2),
  );
  console.log(`\nSummary saved to: ${join(RESULTS_DIR, '_summary.json')}`);
}

main().catch((err) => {
  console.error('Batch extraction failed:', err.message || err);
  process.exit(1);
});
