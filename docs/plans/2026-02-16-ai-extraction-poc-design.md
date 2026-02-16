# AI Document Extraction POC Design

**Date:** 2026-02-16
**Status:** Approved
**Parent Plan:** `plans/ai-document-processing-pipeline.md` (Step 0)

## Purpose

Validate GPT-4o Vision extraction quality against real ACORD insurance documents before building the full pipeline. Standalone CLI tool — no database, no app integration. PDF in, JSON out.

## Package Structure

```
packages/ai-pipeline/
├── poc/
│   ├── extract.ts              # CLI: single PDF → JSON to stdout
│   ├── batch-extract.ts        # CLI: folder of PDFs → results/ folder
│   ├── eval-report.ts          # CLI: compare results vs expected, print accuracy
│   ├── prompts/
│   │   └── acord25.ts          # System prompt (iterate here, track versions)
│   └── fixtures/
│       ├── input/              # Real ACORD PDFs (gitignored — contains PII)
│       ├── expected/           # Human-verified expected outputs (committed)
│       └── results/            # AI extraction outputs per run (gitignored)
├── src/
│   ├── extraction/
│   │   └── pdf-to-images.ts    # PDF → base64 PNG pages
│   ├── ai/
│   │   ├── openai-client.ts    # Thin wrapper with retry
│   │   └── schemas/
│   │       └── extracted-certificate.ts  # Zod structured output schema
│   └── index.ts
├── package.json
├── tsconfig.json
└── .gitignore
```

## Dependencies

- `openai` — API client
- `zod` (catalog: ~4.1.13) — structured output schema
- `pdf-img-convert` — pure JS PDF-to-PNG (no native deps)
- `tsx` (catalog: ~4.19.3) — run TypeScript directly
- `dotenv` — load OPENAI_API_KEY from .env (dev only)

## CLI Commands

```bash
pnpm --filter ai-pipeline poc:extract <path-to-pdf>   # Single PDF → stdout
pnpm --filter ai-pipeline poc:batch                     # All input/ → results/
pnpm --filter ai-pipeline poc:eval                      # results/ vs expected/ → accuracy report
```

## Environment

Reads `OPENAI_API_KEY` from root `.env`. Hard-fails if missing.

## Scope

Includes: PDF-to-image conversion, GPT-4o Vision extraction, Zod structured output, accuracy evaluation.

Does NOT include: database, Supabase, endorsement intelligence, compliance evaluation, task generation, UI.
