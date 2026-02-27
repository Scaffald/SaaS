# AI Extraction POC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone CLI that extracts structured insurance data from ACORD PDF documents using GPT-4o Vision, outputting typed JSON for human review and accuracy measurement.

**Architecture:** New `packages/ai-pipeline` monorepo package. PDF pages rendered to PNG images via `pdf-img-convert`, sent to GPT-4o Vision with a Zod structured output schema. Three CLI tools: single extraction, batch extraction, and eval reporting. No database or app integration.

**Tech Stack:** TypeScript, OpenAI Node SDK (`chat.completions.parse` + `zodResponseFormat`), Zod v4 (v3 compat layer for OpenAI), `pdf-img-convert`, `tsx`, `dotenv`

---

### Task 1: Scaffold the package

**Files:**
- Create: `packages/ai-pipeline/package.json`
- Create: `packages/ai-pipeline/tsconfig.json`
- Create: `packages/ai-pipeline/.gitignore`
- Create: `packages/ai-pipeline/src/index.ts`
- Modify: `pnpm-workspace.yaml` (add `packages/ai-pipeline`)

**Step 1: Create package.json**

```json
{
  "name": "@scf/ai-pipeline",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "poc:extract": "tsx poc/extract.ts",
    "poc:batch": "tsx poc/batch-extract.ts",
    "poc:eval": "tsx poc/eval-report.ts",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "openai": "^4.104.0",
    "pdf-img-convert": "^1.2.1",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "dotenv": "^16.4.7",
    "tsx": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "poc/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create .gitignore**

```gitignore
# Real PDFs contain PII — never commit
poc/fixtures/input/
# Extraction results may contain PII
poc/fixtures/results/
# Node
node_modules/
dist/
```

**Step 4: Create placeholder src/index.ts**

```typescript
export { ExtractedCertificateSchema } from './ai/schemas/extracted-certificate.js';
export { convertPdfToImages } from './extraction/pdf-to-images.js';
export { AIExtractionService } from './ai/openai-client.js';
```

**Step 5: Add to pnpm-workspace.yaml**

Add `- packages/ai-pipeline` to the packages list.

**Step 6: Create fixture directories**

```bash
mkdir -p packages/ai-pipeline/poc/fixtures/input
mkdir -p packages/ai-pipeline/poc/fixtures/expected
mkdir -p packages/ai-pipeline/poc/fixtures/results
mkdir -p packages/ai-pipeline/poc/prompts
mkdir -p packages/ai-pipeline/src/ai/schemas
mkdir -p packages/ai-pipeline/src/extraction
```

**Step 7: Install dependencies**

Run: `pnpm install`

**Step 8: Commit**

```bash
git add packages/ai-pipeline/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(ai-pipeline): scaffold POC package with deps and structure"
```

---

### Task 2: Zod structured output schema

**Files:**
- Create: `packages/ai-pipeline/src/ai/schemas/extracted-certificate.ts`
- Create: `packages/ai-pipeline/src/ai/schemas/__tests__/extracted-certificate.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/ai-pipeline/src/ai/schemas/__tests__/extracted-certificate.test.ts
import { describe, it, expect } from 'vitest';
import { ExtractedCertificateSchema } from '../extracted-certificate.js';

describe('ExtractedCertificateSchema', () => {
  it('parses a valid complete certificate extraction', () => {
    const valid = {
      document_type: 'acord_25',
      producer: { name: 'ABC Insurance Agency', address: '123 Main St', phone: '555-0100', contact: 'John Smith' },
      insured: { name: 'XYZ Contractors LLC', address: '456 Oak Ave', dba: null },
      certificate_holder: { name: 'Big GC Inc', address: '789 Elm St', is_additional_insured: true },
      coverages: [
        {
          type: 'general_liability',
          carrier: 'Travelers Insurance',
          policy_number: 'GL-12345678',
          effective_date: '2026-01-01',
          expiration_date: '2027-01-01',
          limits: {
            each_occurrence: 1000000,
            general_aggregate: 2000000,
            products_comp_aggregate: 2000000,
            personal_adv_injury: 1000000,
            damage_to_rented_premises: 100000,
            medical_expense: 5000,
          },
          commercial_general_liability: {
            claims_made: false,
            occurrence: true,
            policy_aggregate_type: 'per_project',
          },
          auto_liability: null,
          umbrella: null,
        },
      ],
      endorsements: [
        {
          code: 'CG 20 10 04 13',
          type: 'additional_insured',
          description: 'Additional Insured - Owners, Lessees or Contractors - Scheduled Person or Organization',
          applies_to_coverage: 'general_liability',
          is_blanket: false,
          restricts_coverage: false,
          key_conditions: ['Ongoing operations only', 'Scheduled person or organization'],
        },
      ],
      description_of_operations: 'Project: Downtown Office Renovation. XYZ Contractors is performing general contracting services.',
      extraction_confidence: 92,
      extraction_notes: [],
      fields_requiring_review: [],
    };

    const result = ExtractedCertificateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const invalid = { document_type: 'acord_25' };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid document_type', () => {
    const invalid = {
      document_type: 'not_a_real_type',
      producer: { name: 'Test' },
      insured: { name: 'Test' },
      coverages: [],
      endorsements: [],
      extraction_confidence: 50,
      extraction_notes: [],
      fields_requiring_review: [],
    };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects extraction_confidence outside 0-100', () => {
    const invalid = {
      document_type: 'acord_25',
      producer: { name: 'Test' },
      insured: { name: 'Test' },
      coverages: [],
      endorsements: [],
      extraction_confidence: 150,
      extraction_notes: [],
      fields_requiring_review: [],
    };
    const result = ExtractedCertificateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts minimal valid certificate (no coverages, no endorsements)', () => {
    const minimal = {
      document_type: 'acord_25',
      producer: { name: 'Test Agency' },
      insured: { name: 'Test Corp' },
      coverages: [],
      endorsements: [],
      extraction_confidence: 30,
      extraction_notes: ['Document was mostly unreadable'],
      fields_requiring_review: ['coverages'],
    };
    const result = ExtractedCertificateSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @scf/ai-pipeline test:unit`
Expected: FAIL — module `../extracted-certificate.js` not found

**Step 3: Write the schema**

```typescript
// packages/ai-pipeline/src/ai/schemas/extracted-certificate.ts
//
// IMPORTANT: OpenAI's zodResponseFormat requires the zod/v3 compat layer.
// This project uses Zod v4, which ships zod/v3 for backwards compat.
import { z } from 'zod/v3';

export const CoverageLimitsSchema = z.object({
  each_occurrence: z.number().nullable().optional(),
  general_aggregate: z.number().nullable().optional(),
  products_comp_aggregate: z.number().nullable().optional(),
  personal_adv_injury: z.number().nullable().optional(),
  damage_to_rented_premises: z.number().nullable().optional(),
  medical_expense: z.number().nullable().optional(),
  combined_single_limit: z.number().nullable().optional(),
  bodily_injury_per_person: z.number().nullable().optional(),
  bodily_injury_per_accident: z.number().nullable().optional(),
  property_damage: z.number().nullable().optional(),
  each_accident: z.number().nullable().optional(),
  disease_each_employee: z.number().nullable().optional(),
  disease_policy_limit: z.number().nullable().optional(),
});

export const GLDetailsSchema = z.object({
  claims_made: z.boolean(),
  occurrence: z.boolean(),
  policy_aggregate_type: z.enum(['per_project', 'per_location', 'standard']).nullable().optional(),
});

export const AutoDetailsSchema = z.object({
  any_auto: z.boolean(),
  owned_autos: z.boolean(),
  hired_autos: z.boolean(),
  scheduled_autos: z.boolean(),
  non_owned_autos: z.boolean(),
  auto_symbol: z.string().nullable().optional(),
});

export const UmbrellaDetailsSchema = z.object({
  umbrella_form: z.boolean(),
  excess_form: z.boolean(),
  deductible: z.number().nullable().optional(),
  retention: z.number().nullable().optional(),
});

export const CoverageSchema = z.object({
  type: z.enum(['general_liability', 'auto_liability', 'umbrella', 'workers_comp', 'professional_liability']),
  carrier: z.string(),
  policy_number: z.string(),
  effective_date: z.string().describe('ISO 8601 date format YYYY-MM-DD'),
  expiration_date: z.string().describe('ISO 8601 date format YYYY-MM-DD'),
  limits: CoverageLimitsSchema,
  commercial_general_liability: GLDetailsSchema.nullable().optional(),
  auto_liability: AutoDetailsSchema.nullable().optional(),
  umbrella: UmbrellaDetailsSchema.nullable().optional(),
});

export const EndorsementSchema = z.object({
  code: z.string().describe('Endorsement form number, e.g. CG 20 10 04 13'),
  type: z.enum([
    'additional_insured',
    'waiver_of_subrogation',
    'primary_non_contributory',
    'per_project_aggregate',
    'blanket_additional_insured',
    '30_day_notice_cancellation',
    'other',
  ]),
  description: z.string(),
  applies_to_coverage: z.string().describe('Which coverage type this endorsement modifies'),
  is_blanket: z.boolean().describe('True if endorsement applies to all qualifying entities, not just named ones'),
  restricts_coverage: z.boolean().describe('True if this endorsement restricts rather than expands coverage'),
  key_conditions: z.array(z.string()).describe('Notable conditions or limitations in the endorsement'),
});

export const ExtractedCertificateSchema = z.object({
  document_type: z.enum(['acord_25', 'acord_28', 'policy_dec', 'endorsement_schedule']),

  producer: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
  }),

  insured: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    dba: z.string().nullable().optional(),
  }),

  certificate_holder: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    is_additional_insured: z.boolean(),
  }).nullable().optional(),

  coverages: z.array(CoverageSchema),

  endorsements: z.array(EndorsementSchema),

  description_of_operations: z.string().nullable().optional(),

  extraction_confidence: z.number().min(0).max(100),
  extraction_notes: z.array(z.string()).describe('Issues, ambiguities, or notable findings during extraction'),
  fields_requiring_review: z.array(z.string()).describe('Field names where confidence is low or data appears ambiguous'),
});

export type ExtractedCertificate = z.infer<typeof ExtractedCertificateSchema>;
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @scf/ai-pipeline test:unit`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add packages/ai-pipeline/src/ai/schemas/
git commit -m "feat(ai-pipeline): add Zod structured output schema for certificate extraction"
```

---

### Task 3: PDF-to-images converter

**Files:**
- Create: `packages/ai-pipeline/src/extraction/pdf-to-images.ts`
- Create: `packages/ai-pipeline/src/extraction/__tests__/pdf-to-images.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/ai-pipeline/src/extraction/__tests__/pdf-to-images.test.ts
import { describe, it, expect } from 'vitest';
import { convertPdfToImages, type PageImage } from '../pdf-to-images.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Generate a minimal valid PDF in memory for testing.
// This avoids depending on fixture files for unit tests.
function createMinimalPdf(): Buffer {
  // Minimal valid PDF with one blank page
  const pdf = `%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
206
%%EOF`;
  return Buffer.from(pdf);
}

describe('convertPdfToImages', () => {
  it('converts a single-page PDF to one base64 PNG image', async () => {
    const pdf = createMinimalPdf();
    const images = await convertPdfToImages(pdf);

    expect(images).toHaveLength(1);
    expect(images[0].pageNumber).toBe(1);
    expect(images[0].base64).toBeTruthy();
    // Verify it's a valid base64 string (no error on decode)
    expect(() => Buffer.from(images[0].base64, 'base64')).not.toThrow();
  });

  it('returns PageImage objects with required fields', async () => {
    const pdf = createMinimalPdf();
    const images = await convertPdfToImages(pdf);
    const img = images[0];

    expect(img).toHaveProperty('pageNumber');
    expect(img).toHaveProperty('base64');
    expect(typeof img.pageNumber).toBe('number');
    expect(typeof img.base64).toBe('string');
  });

  it('throws on invalid input', async () => {
    await expect(convertPdfToImages(Buffer.from('not a pdf'))).rejects.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @scf/ai-pipeline test:unit`
Expected: FAIL — module `../pdf-to-images.js` not found

**Step 3: Write the implementation**

```typescript
// packages/ai-pipeline/src/extraction/pdf-to-images.ts
import { convert } from 'pdf-img-convert';

export interface PageImage {
  pageNumber: number;
  base64: string;
}

/**
 * Converts PDF buffer to base64-encoded PNG images, one per page.
 * Uses pdf-img-convert (pure JS, uses pdf.js internally).
 *
 * @param pdfBuffer - Raw PDF file as Buffer
 * @returns Array of PageImage objects with base64 PNG strings
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
  // pdf-img-convert accepts Buffer and returns Uint8Array[] of PNG images
  // Scale 1.5 ≈ 150 DPI (balances quality vs token cost for GPT-4o Vision)
  const pngPages = await convert(pdfBuffer, {
    scale: 1.5,
  });

  if (!pngPages || pngPages.length === 0) {
    throw new Error('PDF conversion produced no images — file may be corrupt or empty');
  }

  return pngPages.map((pngData, index) => ({
    pageNumber: index + 1,
    base64: Buffer.from(pngData).toString('base64'),
  }));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @scf/ai-pipeline test:unit`
Expected: All tests PASS (both schema and pdf-to-images suites)

**Step 5: Commit**

```bash
git add packages/ai-pipeline/src/extraction/
git commit -m "feat(ai-pipeline): add PDF-to-images converter using pdf-img-convert"
```

---

### Task 4: ACORD 25 system prompt

**Files:**
- Create: `packages/ai-pipeline/poc/prompts/acord25.ts`

**Step 1: Write the prompt**

```typescript
// packages/ai-pipeline/poc/prompts/acord25.ts

/**
 * ACORD 25 Certificate of Insurance extraction prompt — v1
 *
 * Track prompt versions here. When iterating, copy to acord25-v2.ts etc.
 * so we can A/B compare extraction quality across versions.
 */
export const ACORD25_SYSTEM_PROMPT = `You are an expert insurance document analyst specializing in ACORD 25 Certificates of Liability Insurance. Your task is to extract structured data from certificate images with high accuracy.

## Document Layout Knowledge

ACORD 25 certificates follow a standard layout:
- **Top section**: Producer (insurance agency) info on the left, certificate date on the right
- **Insured section**: Named insured and their address below the producer
- **Coverages table**: The main body — rows for General Liability, Auto Liability, Umbrella/Excess, Workers Comp
  - Each row has: Insurance carrier, Policy number, Effective date, Expiration date, Limits
  - General Liability row has checkboxes: Claims-Made vs Occurrence, and aggregate type
  - Auto Liability row has checkboxes: Any Auto, Owned, Hired, Scheduled, Non-Owned
  - Workers Comp shows: Each Accident, Disease-Each Employee, Disease-Policy Limit
- **Description of Operations**: Free-text box — often contains endorsement references, project details, and additional insured language
- **Certificate Holder**: Bottom-left box with the entity requesting the certificate

## Extraction Rules

1. **Dates**: Always output in ISO 8601 format (YYYY-MM-DD). Convert MM/DD/YYYY or other formats.
2. **Dollar amounts**: Extract as plain numbers without currency symbols or commas. "$1,000,000" → 1000000
3. **Coverage types**: Map to exactly one of: general_liability, auto_liability, umbrella, workers_comp, professional_liability
4. **Policy numbers**: Extract exactly as printed, preserving hyphens, spaces, and alphanumeric characters
5. **Endorsements**: Check BOTH the endorsement columns in the coverages table AND the Description of Operations box. Endorsements are often listed as form numbers (e.g., "CG 20 10 04 13") in the description.
6. **Additional Insured**: Check if the certificate holder box has "Additional Insured" language OR if there's an "X" in the Additional Insured column
7. **Blanket vs Named**: If endorsement says "blanket" or "automatic" or "any person or organization", it's blanket. If it names a specific entity, it's named (not blanket).
8. **Missing data**: If a field is not present or not readable, use null. Do not guess.
9. **Confidence**: Rate your overall confidence 0-100. Deduct points for: poor image quality (-10 to -30), missing sections (-5 to -15), ambiguous values (-5 per field).
10. **Fields requiring review**: List any field names where you're uncertain about the extracted value.

## Common Pitfalls

- The Description of Operations box often contains critical endorsement information — never skip it
- Auto liability "Symbol 1" means "Any Auto" — this is the broadest coverage
- "Per Project Aggregate" in GL means CG 25 03 endorsement is in effect
- Workers Comp limits are statutory in most states — the numbers shown are Employers Liability limits
- Umbrella vs Excess: Umbrella provides broader drop-down coverage; Excess only follows form of underlying
- Certificate holder being listed does NOT automatically mean they are an Additional Insured — check for explicit AI language`;

export const PROMPT_VERSION = 'v1';
```

**Step 2: Commit**

```bash
git add packages/ai-pipeline/poc/prompts/
git commit -m "feat(ai-pipeline): add ACORD 25 system prompt v1"
```

---

### Task 5: OpenAI client wrapper

**Files:**
- Create: `packages/ai-pipeline/src/ai/openai-client.ts`

**Step 1: Write the client**

```typescript
// packages/ai-pipeline/src/ai/openai-client.ts
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ExtractedCertificateSchema, type ExtractedCertificate } from './schemas/extracted-certificate.js';
import type { PageImage } from '../extraction/pdf-to-images.js';

export interface ExtractionResult {
  data: ExtractedCertificate;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  duration_ms: number;
}

export class AIExtractionService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required. Set it in your .env file.');
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Extract structured certificate data from PDF page images.
   *
   * @param pages - Base64-encoded PNG images of each page
   * @param systemPrompt - The system prompt to use for extraction
   * @returns Typed extraction result with usage stats
   */
  async extractCertificate(
    pages: PageImage[],
    systemPrompt: string,
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    const imageContent = pages.map((page) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/png;base64,${page.base64}`,
        detail: 'high' as const,
      },
    }));

    const completion = await this.client.chat.completions.parse({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text' as const,
              text: 'Extract all insurance data from this ACORD certificate. Identify every coverage type, limit, endorsement, and named party. Check the Description of Operations box for endorsement references. Flag any fields that appear ambiguous or low-confidence.',
            },
          ],
        },
      ],
      response_format: zodResponseFormat(ExtractedCertificateSchema, 'certificate_extraction'),
      temperature: 0, // Deterministic extraction
    });

    const duration_ms = Date.now() - startTime;

    const message = completion.choices[0]?.message;
    if (!message?.parsed) {
      const refusal = message?.refusal;
      throw new Error(
        refusal
          ? `Model refused extraction: ${refusal}`
          : 'AI extraction returned no parsed result',
      );
    }

    return {
      data: message.parsed,
      model: completion.model,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : null,
      duration_ms,
    };
  }
}
```

**Step 2: Commit**

```bash
git add packages/ai-pipeline/src/ai/openai-client.ts
git commit -m "feat(ai-pipeline): add OpenAI client wrapper with Vision + structured output"
```

---

### Task 6: Single-document extraction CLI

**Files:**
- Create: `packages/ai-pipeline/poc/extract.ts`

**Step 1: Write the CLI tool**

```typescript
// packages/ai-pipeline/poc/extract.ts
/**
 * POC CLI: Extract structured data from a single ACORD PDF.
 *
 * Usage:
 *   pnpm --filter @scf/ai-pipeline poc:extract <path-to-pdf>
 *   pnpm --filter @scf/ai-pipeline poc:extract poc/fixtures/input/sample.pdf
 */
import 'dotenv/config';
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

  console.error(`\n--- ACORD Extraction POC ---`);
  console.error(`File: ${fileName}`);
  console.error(`Prompt: ${PROMPT_VERSION}`);
  console.error(`Model: gpt-4o`);
  console.error(`---`);

  // 1. Read PDF
  console.error(`Reading PDF...`);
  const pdfBuffer = readFileSync(resolvedPath);
  console.error(`PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  // 2. Convert to images
  console.error(`Converting to images...`);
  const pages = await convertPdfToImages(pdfBuffer);
  console.error(`Pages: ${pages.length}`);

  // 3. Extract via GPT-4o Vision
  console.error(`Sending to GPT-4o Vision...`);
  const service = new AIExtractionService(apiKey);
  const result = await service.extractCertificate(pages, ACORD25_SYSTEM_PROMPT);

  // 4. Print metadata to stderr (so JSON output on stdout is clean)
  console.error(`\n--- Results ---`);
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
  console.error(`---\n`);

  // 5. Print structured JSON to stdout (pipe-friendly)
  console.log(JSON.stringify(result.data, null, 2));
}

main().catch((err) => {
  console.error('Extraction failed:', err.message || err);
  process.exit(1);
});
```

**Step 2: Commit**

```bash
git add packages/ai-pipeline/poc/extract.ts
git commit -m "feat(ai-pipeline): add single-document extraction CLI"
```

---

### Task 7: Batch extraction CLI

**Files:**
- Create: `packages/ai-pipeline/poc/batch-extract.ts`

**Step 1: Write the batch CLI tool**

```typescript
// packages/ai-pipeline/poc/batch-extract.ts
/**
 * POC CLI: Batch-extract all PDFs in fixtures/input/, save results to fixtures/results/.
 *
 * Usage:
 *   pnpm --filter @scf/ai-pipeline poc:batch
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import { convertPdfToImages } from '../src/extraction/pdf-to-images.js';
import { AIExtractionService } from '../src/ai/openai-client.js';
import { ACORD25_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts/acord25.js';

const INPUT_DIR = resolve(import.meta.dirname, 'fixtures/input');
const RESULTS_DIR = resolve(import.meta.dirname, 'fixtures/results');

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

  console.log(`\n=== ACORD Batch Extraction ===`);
  console.log(`Prompt: ${PROMPT_VERSION}`);
  console.log(`Model: gpt-4o`);
  console.log(`Documents: ${files.length}`);
  console.log(`=============================\n`);

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
    const resultName = basename(file, extname(file)) + '.json';
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

      console.log(`  ✓ Confidence: ${result.data.extraction_confidence}% | Coverages: ${result.data.coverages.length} | Endorsements: ${result.data.endorsements.length} | ${result.duration_ms}ms | $${costEstimate.toFixed(4)}`);
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
      console.log(`  ✗ ERROR: ${message}`);
    }
  }

  // Print summary
  const succeeded = summary.filter((s) => !s.error);
  const failed = summary.filter((s) => s.error);
  const totalCost = summary.reduce((sum, s) => sum + s.cost_estimate, 0);
  const avgConfidence = succeeded.length > 0
    ? succeeded.reduce((sum, s) => sum + s.confidence, 0) / succeeded.length
    : 0;

  console.log(`\n=== Batch Summary ===`);
  console.log(`Succeeded: ${succeeded.length}/${files.length}`);
  console.log(`Failed: ${failed.length}/${files.length}`);
  console.log(`Avg confidence: ${avgConfidence.toFixed(1)}%`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Results saved to: ${RESULTS_DIR}`);

  if (failed.length > 0) {
    console.log(`\nFailed documents:`);
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
```

**Step 2: Commit**

```bash
git add packages/ai-pipeline/poc/batch-extract.ts
git commit -m "feat(ai-pipeline): add batch extraction CLI with summary reporting"
```

---

### Task 8: Eval report CLI

**Files:**
- Create: `packages/ai-pipeline/poc/eval-report.ts`

**Step 1: Write the eval report tool**

```typescript
// packages/ai-pipeline/poc/eval-report.ts
/**
 * POC CLI: Compare extraction results against human-verified expected outputs.
 * Produces per-field accuracy metrics.
 *
 * Usage:
 *   pnpm --filter @scf/ai-pipeline poc:eval
 *
 * Expected files: poc/fixtures/expected/<name>.json (same name as input PDFs)
 * Results files:  poc/fixtures/results/<name>.json  (generated by batch-extract)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import type { ExtractedCertificate } from '../src/ai/schemas/extracted-certificate.js';

const EXPECTED_DIR = resolve(import.meta.dirname, 'fixtures/expected');
const RESULTS_DIR = resolve(import.meta.dirname, 'fixtures/results');

interface FieldComparison {
  field: string;
  matches: number;
  total: number;
  mismatches: Array<{ file: string; expected: unknown; actual: unknown }>;
}

function fuzzyMatch(expected: string | null | undefined, actual: string | null | undefined): boolean {
  if (expected == null && actual == null) return true;
  if (expected == null || actual == null) return false;
  // Normalize: lowercase, trim, collapse whitespace
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  return norm(expected) === norm(actual);
}

function compareField(
  fieldName: string,
  expected: unknown,
  actual: unknown,
  fileName: string,
  comparisons: Map<string, FieldComparison>,
): void {
  if (!comparisons.has(fieldName)) {
    comparisons.set(fieldName, { field: fieldName, matches: 0, total: 0, mismatches: [] });
  }
  const comp = comparisons.get(fieldName)!;
  comp.total++;

  // Skip null/undefined expected (field wasn't verified by human)
  if (expected === null || expected === undefined) {
    comp.matches++; // Don't penalize unverified fields
    return;
  }

  let isMatch = false;
  if (typeof expected === 'string' && typeof actual === 'string') {
    isMatch = fuzzyMatch(expected, actual);
  } else if (typeof expected === 'number' && typeof actual === 'number') {
    isMatch = expected === actual;
  } else if (typeof expected === 'boolean' && typeof actual === 'boolean') {
    isMatch = expected === actual;
  } else {
    isMatch = JSON.stringify(expected) === JSON.stringify(actual);
  }

  if (isMatch) {
    comp.matches++;
  } else {
    comp.mismatches.push({ file: fileName, expected, actual });
  }
}

function compareCertificates(
  expected: ExtractedCertificate,
  actual: ExtractedCertificate,
  fileName: string,
  comparisons: Map<string, FieldComparison>,
): void {
  // Top-level fields
  compareField('document_type', expected.document_type, actual.document_type, fileName, comparisons);
  compareField('producer.name', expected.producer?.name, actual.producer?.name, fileName, comparisons);
  compareField('insured.name', expected.insured?.name, actual.insured?.name, fileName, comparisons);
  compareField('certificate_holder.name', expected.certificate_holder?.name, actual.certificate_holder?.name, fileName, comparisons);
  compareField('extraction_confidence', expected.extraction_confidence, actual.extraction_confidence, fileName, comparisons);

  // Coverage-level fields — match by type
  for (const expectedCov of expected.coverages) {
    const actualCov = actual.coverages.find((c) => c.type === expectedCov.type);
    const prefix = `coverage.${expectedCov.type}`;

    if (!actualCov) {
      compareField(`${prefix}.found`, true, false, fileName, comparisons);
      continue;
    }

    compareField(`${prefix}.found`, true, true, fileName, comparisons);
    compareField(`${prefix}.carrier`, expectedCov.carrier, actualCov.carrier, fileName, comparisons);
    compareField(`${prefix}.policy_number`, expectedCov.policy_number, actualCov.policy_number, fileName, comparisons);
    compareField(`${prefix}.effective_date`, expectedCov.effective_date, actualCov.effective_date, fileName, comparisons);
    compareField(`${prefix}.expiration_date`, expectedCov.expiration_date, actualCov.expiration_date, fileName, comparisons);

    // Limits
    if (expectedCov.limits) {
      for (const [key, val] of Object.entries(expectedCov.limits)) {
        if (val != null) {
          compareField(
            `${prefix}.limits.${key}`,
            val,
            actualCov.limits?.[key as keyof typeof actualCov.limits],
            fileName,
            comparisons,
          );
        }
      }
    }
  }

  // Check for extra coverages the AI found that weren't expected
  for (const actualCov of actual.coverages) {
    const expectedCov = expected.coverages.find((c) => c.type === actualCov.type);
    if (!expectedCov) {
      compareField(`coverage.${actualCov.type}.spurious`, false, true, fileName, comparisons);
    }
  }

  // Endorsements — compare counts and types
  compareField('endorsements.count', expected.endorsements.length, actual.endorsements.length, fileName, comparisons);
  for (const expectedEnd of expected.endorsements) {
    const actualEnd = actual.endorsements.find(
      (e) => fuzzyMatch(e.code, expectedEnd.code) || fuzzyMatch(e.type, expectedEnd.type),
    );
    const prefix = `endorsement.${expectedEnd.code || expectedEnd.type}`;

    if (!actualEnd) {
      compareField(`${prefix}.found`, true, false, fileName, comparisons);
      continue;
    }
    compareField(`${prefix}.found`, true, true, fileName, comparisons);
    compareField(`${prefix}.type`, expectedEnd.type, actualEnd.type, fileName, comparisons);
    compareField(`${prefix}.is_blanket`, expectedEnd.is_blanket, actualEnd.is_blanket, fileName, comparisons);
  }
}

function printBar(ratio: number, width = 20): string {
  const filled = Math.round(ratio * width);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function main() {
  let expectedFiles: string[];
  try {
    expectedFiles = readdirSync(EXPECTED_DIR).filter((f) => extname(f) === '.json');
  } catch {
    console.error(`No expected directory found at ${EXPECTED_DIR}`);
    console.error('Create expected JSON files by reviewing and correcting extraction results.');
    process.exit(1);
  }

  if (expectedFiles.length === 0) {
    console.error('No expected JSON files found. Create them from reviewed extraction results.');
    process.exit(1);
  }

  const comparisons = new Map<string, FieldComparison>();
  let matched = 0;
  let total = 0;

  for (const file of expectedFiles) {
    const resultPath = join(RESULTS_DIR, file);
    const expectedPath = join(EXPECTED_DIR, file);

    let actual: ExtractedCertificate;
    try {
      actual = JSON.parse(readFileSync(resultPath, 'utf-8'));
    } catch {
      console.error(`  No result file for ${file} — run poc:batch first`);
      continue;
    }

    const expected: ExtractedCertificate = JSON.parse(readFileSync(expectedPath, 'utf-8'));
    compareCertificates(expected, actual, basename(file, '.json'), comparisons);
    total++;
  }

  // Print report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ACORD Extraction POC - Eval Report`);
  console.log(`  Documents compared: ${total}`);
  console.log(`  Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`Per-field accuracy:\n`);

  const sortedFields = [...comparisons.entries()].sort((a, b) => {
    const aRatio = a[1].matches / a[1].total;
    const bRatio = b[1].matches / b[1].total;
    return bRatio - aRatio;
  });

  for (const [, comp] of sortedFields) {
    const ratio = comp.total > 0 ? comp.matches / comp.total : 0;
    const pct = (ratio * 100).toFixed(0).padStart(3);
    const bar = printBar(ratio);
    const counts = `(${comp.matches}/${comp.total})`;
    console.log(`  ${comp.field.padEnd(40)} ${bar} ${pct}% ${counts}`);
  }

  // Print mismatches
  const allMismatches = sortedFields.flatMap(([, comp]) =>
    comp.mismatches.map((m) => ({ field: comp.field, ...m })),
  );

  if (allMismatches.length > 0) {
    console.log(`\nMismatches (${allMismatches.length} total):\n`);
    for (const m of allMismatches) {
      console.log(`  ${m.file} > ${m.field}`);
      console.log(`    expected: ${JSON.stringify(m.expected)}`);
      console.log(`    actual:   ${JSON.stringify(m.actual)}`);
    }
  }

  // Overall accuracy
  let totalMatches = 0;
  let totalChecks = 0;
  for (const [, comp] of comparisons) {
    totalMatches += comp.matches;
    totalChecks += comp.total;
  }
  const overallAccuracy = totalChecks > 0 ? ((totalMatches / totalChecks) * 100).toFixed(1) : '0';
  console.log(`\nOverall field accuracy: ${overallAccuracy}% (${totalMatches}/${totalChecks})`);
}

main();
```

**Step 2: Commit**

```bash
git add packages/ai-pipeline/poc/eval-report.ts
git commit -m "feat(ai-pipeline): add eval report CLI for extraction accuracy measurement"
```

---

### Task 9: Update src/index.ts exports and verify everything compiles

**Files:**
- Modify: `packages/ai-pipeline/src/index.ts`

**Step 1: Update the barrel export**

```typescript
// packages/ai-pipeline/src/index.ts
export {
  ExtractedCertificateSchema,
  CoverageSchema,
  EndorsementSchema,
  CoverageLimitsSchema,
  type ExtractedCertificate,
} from './ai/schemas/extracted-certificate.js';
export { convertPdfToImages, type PageImage } from './extraction/pdf-to-images.js';
export { AIExtractionService, type ExtractionResult } from './ai/openai-client.js';
```

**Step 2: Run typecheck**

Run: `pnpm --filter @scf/ai-pipeline typecheck`
Expected: No errors

**Step 3: Run all unit tests**

Run: `pnpm --filter @scf/ai-pipeline test:unit`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add packages/ai-pipeline/src/index.ts
git commit -m "feat(ai-pipeline): finalize exports and verify POC compiles"
```

---

### Task 10: Test with a real ACORD document

This is a manual testing step — not automated.

**Step 1: Add your ACORD PDF**

Drop a real ACORD 25 PDF into `packages/ai-pipeline/poc/fixtures/input/`.

**Step 2: Run single extraction**

Run: `pnpm --filter @scf/ai-pipeline poc:extract poc/fixtures/input/<your-file>.pdf`

Review the JSON output. Check:
- Are coverage types correct?
- Are limit amounts accurate?
- Are dates in ISO 8601 format?
- Are endorsements captured (especially from Description of Operations)?
- Is the confidence score reasonable?
- Are ambiguous fields flagged in `fields_requiring_review`?

**Step 3: Create expected output for eval**

Copy the result JSON, correct any errors, and save as:
`packages/ai-pipeline/poc/fixtures/expected/<your-file>.json`

**Step 4: Run batch + eval**

Run: `pnpm --filter @scf/ai-pipeline poc:batch`
Run: `pnpm --filter @scf/ai-pipeline poc:eval`

Review the accuracy report. Iterate on the prompt in `poc/prompts/acord25.ts` as needed.
