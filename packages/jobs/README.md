# Jobs package

This package hosts domain types, utilities, and adapter contracts for ingesting external job listings into the Scaffald platform.

## Overview

Adapters are responsible for fetching raw listings from upstream sources, normalizing them to shared schemas, and reporting telemetry about the ingestion session. Downstream services can rely on the exported Zod schemas and TypeScript types to validate and consume those records.

## Schemas

- `NormalizedJob` and `NormalizedOrganization` express the canonical data model for job listings and their publishing companies.
- Supporting schemas like `Location`, `Compensation`, and enumerations for employment/experience levels ensure consistent validation across sources.

## Adapter expectations

Adapters should:

- Populate required fields: job `identifier`, `title`, `url`, and an associated `organization.name`. At least one of `description` or `summary` should be provided. Organizations must include a canonical `name` and any identifier available from the upstream system.
- Normalize timestamps (`postedAt`, `updatedAt`, rate-limit reset times, etc.) to ISO-8601 strings or native `Date` instances in **UTC**. Local timezone information should be provided on each `Location` via the `timeZone` field when available.
- Surface compensation ranges in the declared currency and periodicity. If only a single amount is available, populate `minAmount` and leave `maxAmount` undefined.
- Use the shared `buildJobFingerprint` helper when deduplicating records against previously ingested jobs.
- Respect rate limits exposed by upstream APIs and populate the `AdapterTelemetry.rateLimit` metadata, including the limit, remaining requests, and the UTC reset timestamp when possible.
- Return pagination cursors in `AdapterPullResult.nextCursor` to allow incremental ingestion.

## Testing

Vitest unit tests cover schema parsing, fingerprint generation, and example adapter behaviors. Run them via:

```bash
yarn workspace @app/jobs test
```
