# AI Extraction Schema Reference

> For engineers integrating AI extraction results into the ForSured application.
> Schema version: v2 | Prompt version: v2 | Model: GPT-4o Vision

## Overview

The AI extraction pipeline converts ACORD 25 (Certificate of Liability Insurance) PDFs into structured JSON. It uses GPT-4o Vision with structured outputs to extract every field from the form.

**Pipeline flow:** PDF file → PNG images (150 DPI) → GPT-4o Vision → Zod-validated JSON

**Source schema:** `packages/ai-pipeline/src/ai/schemas/extracted-certificate.ts`

---

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document_type` | enum | yes | `acord_25`, `acord_28`, `policy_dec`, or `endorsement_schedule` |
| `certificate_number` | string \| null | no | Producer-assigned certificate reference number |
| `certificate_issue_date` | string \| null | no | Date cert was issued (YYYY-MM-DD). Different from policy dates. |
| `certificate_revision_number` | string \| null | no | Revision number if the certificate was reissued |
| `producer` | object | yes | Insurance broker/agency info (see below) |
| `insured` | object | yes | Named insured party (see below) |
| `certificate_holder` | object \| null | no | Entity requesting the certificate (see below) |
| `insurers` | array | yes | Insurers affording coverage, with letter designations (see below) |
| `coverages` | array | yes | All coverage lines on the certificate (see below) |
| `endorsements` | array | yes | Endorsements found on cert or in Description of Operations (see below) |
| `description_of_operations` | string \| null | no | Full text from the "Description of Operations / Locations / Vehicles" box |
| `cancellation_notice_days` | number \| null | no | Days advance notice for cancellation (e.g., 30) |
| `authorized_representative` | string \| null | no | Name of person who signed/authorized the certificate |
| `extraction_confidence` | number | yes | 0-100 confidence score. See "Confidence Scoring" below. |
| `extraction_notes` | string[] | yes | AI observations about the extraction (ambiguities, quality issues) |
| `fields_requiring_review` | string[] | yes | Field names where the AI is uncertain |

---

## Producer (Broker/Agency)

The producer is the insurance broker or agency that issued the certificate. This is the primary contact for requesting certificate changes.

```json
{
  "name": "CMR Risk & Insurance Services",
  "address": "110 W A Street, Ste. 725, San Diego, CA 92101",
  "phone": "(619) 297-3160",
  "fax": "(619) 297-3161",
  "email": "certs@cmrrisk.com",
  "contact": "Hannah McGarrey"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Agency/brokerage name |
| `address` | string \| null | no | Full mailing address (may contain newlines) |
| `phone` | string \| null | no | Phone number as printed |
| `fax` | string \| null | no | Fax number as printed |
| `email` | string \| null | no | Email address |
| `contact` | string \| null | no | Contact person name at the agency |

---

## Insured

The named insured — the contractor or company holding the insurance policies.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Legal entity name |
| `address` | string \| null | no | Mailing address |
| `dba` | string \| null | no | "Doing Business As" name, if shown |

---

## Certificate Holder

The entity that requested the certificate — typically the GC, project owner, or lender.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Certificate holder name |
| `address` | string \| null | no | Mailing address |
| `is_additional_insured` | boolean | yes | Whether the cert holder is listed as additional insured |

---

## Insurers Affording Coverage

ACORD 25 forms list insurers by letter designation (A through F) at the top of the form. Each coverage row references an insurer letter.

```json
[
  { "letter": "A", "name": "Zurich American Insurance Company", "naic": "16535" },
  { "letter": "B", "name": "Zurich American Insurance Company", "naic": "16535" }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `letter` | string | yes | Letter designation: A, B, C, D, E, or F |
| `name` | string | yes | Full carrier/insurer name |
| `naic` | string \| null | no | NAIC code (5-digit identifier for carrier verification) |

---

## Coverages

Each coverage line from the certificate table. Common types: GL, Auto, Umbrella, Workers Comp.

```json
{
  "type": "general_liability",
  "type_other_description": null,
  "carrier": "Zurich American Insurance Company",
  "carrier_naic": "16535",
  "insurer_letter": "A",
  "policy_number": "GLO-3169359-00",
  "effective_date": "2025-11-30",
  "expiration_date": "2026-11-30",
  "subrogation_waived": true,
  "limits": { ... },
  "commercial_general_liability": { ... },
  "auto_liability": null,
  "umbrella": null,
  "workers_comp": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | yes | `general_liability`, `auto_liability`, `umbrella`, `workers_comp`, `professional_liability`, `inland_marine`, `pollution_liability`, `builders_risk`, `other` |
| `type_other_description` | string \| null | no | Description when type is `other` |
| `carrier` | string | yes | Insurance company name |
| `carrier_naic` | string \| null | no | NAIC code for the carrier |
| `insurer_letter` | string \| null | no | Letter reference (A-F) matching the insurers list |
| `policy_number` | string | yes | Policy number exactly as printed |
| `effective_date` | string | yes | Policy start date (YYYY-MM-DD) |
| `expiration_date` | string | yes | Policy end date (YYYY-MM-DD) |
| `subrogation_waived` | boolean \| null | no | Whether the WOS checkbox is marked for this coverage |
| `limits` | object | yes | Coverage limits (see below) |
| `commercial_general_liability` | object \| null | no | GL-specific details (only for GL coverage) |
| `auto_liability` | object \| null | no | Auto-specific details (only for Auto coverage) |
| `umbrella` | object \| null | no | Umbrella/Excess details (only for Umbrella coverage) |
| `workers_comp` | object \| null | no | WC-specific details (only for WC coverage) |

### Coverage Limits

All limit values are numbers in dollars (no formatting). Null means the field doesn't apply to this coverage type.

| Field | Type | Applies To | Description |
|-------|------|------------|-------------|
| `each_occurrence` | number \| null | GL, Umbrella, Prof. Liability | Per-occurrence limit |
| `general_aggregate` | number \| null | GL, Umbrella | General aggregate limit |
| `products_comp_aggregate` | number \| null | GL | Products/completed operations aggregate |
| `personal_adv_injury` | number \| null | GL | Personal and advertising injury limit |
| `damage_to_rented_premises` | number \| null | GL | Damage to rented premises limit |
| `medical_expense` | number \| null | GL | Medical expense limit |
| `combined_single_limit` | number \| null | Auto | Combined single limit |
| `bodily_injury_per_person` | number \| null | Auto | BI per person (split limits) |
| `bodily_injury_per_accident` | number \| null | Auto | BI per accident (split limits) |
| `property_damage` | number \| null | Auto | Property damage limit (split limits) |
| `each_accident` | number \| null | WC | Employers liability - each accident |
| `disease_each_employee` | number \| null | WC | Employers liability - disease per employee |
| `disease_policy_limit` | number \| null | WC | Employers liability - disease policy limit |

### GL Details (`commercial_general_liability`)

| Field | Type | Description |
|-------|------|-------------|
| `claims_made` | boolean | Claims-made form (vs occurrence) |
| `occurrence` | boolean | Occurrence form (vs claims-made) |
| `policy_aggregate_type` | enum \| null | `per_project`, `per_location`, or `standard` |

### Auto Details (`auto_liability`)

| Field | Type | Description |
|-------|------|-------------|
| `any_auto` | boolean | Any Auto checkbox (broadest) |
| `owned_autos` | boolean | Owned autos only |
| `hired_autos` | boolean | Hired autos |
| `scheduled_autos` | boolean | Scheduled autos |
| `non_owned_autos` | boolean | Non-owned autos |
| `auto_symbol` | string \| null | Auto symbol number (e.g., "1" = Any Auto) |

### Umbrella Details (`umbrella`)

| Field | Type | Description |
|-------|------|-------------|
| `umbrella_form` | boolean | True if umbrella (broader, drop-down coverage) |
| `excess_form` | boolean | True if excess (follows form of underlying only) |
| `deductible` | number \| null | Deductible amount |
| `retention` | number \| null | Self-insured retention amount |

### Workers Comp Details (`workers_comp`)

| Field | Type | Description |
|-------|------|-------------|
| `statutory_limits` | boolean | Whether statutory limits checkbox is marked |
| `wc_states` | string[] | States listed for WC coverage |

---

## Endorsements

Endorsements modify coverage terms. They may be listed in the coverage table columns or referenced in the Description of Operations text.

```json
{
  "code": "CG 20 10 04 13",
  "type": "additional_insured",
  "description": "Additional Insured - Owners, Lessees or Contractors",
  "applies_to_coverage": "general_liability",
  "is_blanket": true,
  "restricts_coverage": false,
  "key_conditions": ["Ongoing operations only"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | yes | Form number (e.g., "CG 20 10 04 13") |
| `type` | enum | yes | `additional_insured`, `waiver_of_subrogation`, `primary_non_contributory`, `per_project_aggregate`, `blanket_additional_insured`, `30_day_notice_cancellation`, `other` |
| `description` | string | yes | Human-readable description |
| `applies_to_coverage` | string | yes | Which coverage type this modifies |
| `is_blanket` | boolean | yes | True = applies to all qualifying entities; False = named/scheduled |
| `restricts_coverage` | boolean | yes | True = restricts coverage; False = expands coverage |
| `key_conditions` | string[] | yes | Notable conditions or limitations |

---

## Confidence Scoring

The `extraction_confidence` field (0-100) indicates how reliable the extraction is:

| Range | Meaning | Action |
|-------|---------|--------|
| 90-100 | High confidence | Auto-accept, no human review needed |
| 75-89 | Moderate confidence | Review `fields_requiring_review` only |
| 50-74 | Low confidence | Full human review recommended |
| 0-49 | Very low confidence | Likely poor image quality or non-standard form |

Deductions are applied for:
- Poor image quality: -10 to -30
- Missing form sections: -5 to -15
- Ambiguous values: -5 per field

---

## Example: Full Extraction Output

See `poc/fixtures/results/` for real extraction outputs from production ACORD documents.

---

## Integration Notes for ForSured Engineers

### Mapping to Database

| Extraction Field | Database Table | Column |
|-----------------|----------------|--------|
| `producer.*` | `organizations` | Create or match broker org |
| `insured.*` | `organizations` | Create or match insured org |
| `certificate_holder.*` | `organizations` | Create or match cert holder org |
| `coverages[].carrier` | `insurance_policies.carrier_name` | |
| `coverages[].carrier_naic` | `insurance_policies.carrier_naic` | NEW — needs migration |
| `coverages[].policy_number` | `insurance_policies.policy_number` | |
| `coverages[].effective_date` | `insurance_policies.effective_date` | |
| `coverages[].expiration_date` | `insurance_policies.expiration_date` | |
| `coverages[].type` | `insurance_policies.policy_type` | |
| `coverages[].limits.*` | `policy_provisions` | One row per limit |
| `endorsements[]` | `policy_endorsements` | One row per endorsement |
| `description_of_operations` | `documents.metadata` | Store as JSONB |
| `extraction_confidence` | `documents.extraction_confidence` | NEW — needs migration |

### Key Behaviors

1. **Dates are ISO 8601**: All dates are `YYYY-MM-DD` strings. Parse with `new Date()` or a date library.
2. **Dollar amounts are numbers**: `1000000` not `"$1,000,000"`. No formatting applied.
3. **Null means absent**: A null field means it wasn't on the form or wasn't readable. Don't default to 0.
4. **`fields_requiring_review`**: These field names should trigger UI indicators for human review.
5. **Producer = Broker**: The "producer" in ACORD terminology is the insurance broker/agency. This maps to the broker role in ForSured.
6. **Insurer letters**: The `insurers` array maps letter designations (A-F) to carrier names with NAIC codes. Each coverage row's `insurer_letter` references this list.
7. **Subrogation waived**: The `subrogation_waived` flag on each coverage indicates whether the WOS (Waiver of Subrogation) checkbox is marked for that specific coverage line.

### Running the POC

```bash
# Single document extraction (JSON to stdout)
pnpm --filter @scf/ai-pipeline poc:extract poc/fixtures/input/your-file.pdf

# Batch extraction (all PDFs in input/)
pnpm --filter @scf/ai-pipeline poc:batch

# Eval report (compare results vs expected)
pnpm --filter @scf/ai-pipeline poc:eval
```

Requires `OPENAI_API_KEY` in root `.env` file.

### Cost Per Document

| Document Size | Cost | Duration |
|--------------|------|----------|
| 1-page COI (simple) | ~$0.01-0.02 | ~10-15s |
| 1-page COI (dense) | ~$0.02-0.04 | ~15-25s |
| Multi-page COI + endorsements | ~$0.05-0.08 | ~30-60s |
