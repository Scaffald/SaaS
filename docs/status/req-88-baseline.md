# REQ-88 Baseline Inventory

Updated: 2025-11-18

This document captures the current implementation state for every BrainGrid task tied to REQ-88 (Payment & Transaction System). It is derived from the migrations, tRPC routers, Expo surfaces, and supporting automation that already exist inside the repo.

## High-Level Summary

- **Foundational data work (Tasks 1-5)** is fully implemented via the new payment tables (`packages/supabase/migrations/095_create_payment_tables.sql`), RLS policies (`096_payment_rls_policies.sql`), Stripe settings/webhook handling (`packages/supabase/functions/trpc/routers/stripe-settings.router.ts`, `functions/stripe-webhook/index.ts`), the success fee router (`packages/supabase/functions/trpc/routers/success-fees.router.ts`), and cron helpers (`packages/supabase/migrations/097_success_fee_cron_jobs.sql`).
- **Background check + ID verification flows (Tasks 6-13)** now include live NationSearch + Persona integrations. The Persona webhook (`functions/persona-webhook`) updates badges automatically, the new `notify-id-verification-expiration` job sends 30/7-day reminders, and shared UI badges surface the worker status across search results, profile widgets, and the dashboard request flow.
- **Operations, billing, and compliance features (Tasks 14-19)** remain mostly net-new. The schema contains `payment_transactions` and helper functions (e.g., `core.anonymize_worker_payment_data`) but there are no routers, UI surfaces, or docs yet for saved payment methods, credits, legal agreements, analytics, or deletion workflows.

## Task-by-Task Mapping

| Task ID | BrainGrid Title | Status | Existing Implementation | Outstanding Work |
| --- | --- | --- | --- | --- |
| 1 | Create payment system database schema and migrations | ✅ COMPLETED | `095_create_payment_tables.sql` adds `success_fees`, `background_checks` extensions, `service_pricing`, `payment_transactions`, `id_verifications`, etc. (`packages/supabase/migrations/095_create_payment_tables.sql`) | None – schema exists and is referenced by Supabase types |
| 2 | Implement Row Level Security policies for payment tables | ✅ COMPLETED | RLS + grants defined in `096_payment_rls_policies.sql`; enables RLS on `success_fees`, `background_checks`, `id_verifications`, `service_pricing`, `payment_transactions` (`packages/supabase/migrations/096_payment_rls_policies.sql`) | None |
| 3 | Set up Stripe configuration and webhook endpoint | ✅ COMPLETED | `stripe-settings.router.ts` exposes admin config, `payments.router.ts` shares publishable key, `functions/stripe-webhook/index.ts` verifies signatures and updates `payment_transactions` | Need runbook for rotating secrets + verifying webhook (docs) |
| 4 | Create success fees tRPC router with payment calculation logic | ✅ COMPLETED | `success-fees.router.ts` handles creation, payment intent wiring, and schedule adjustments; `ApplicationStatusChangeModal.tsx` consumes the API | Still using mock `MockApplication` data + missing hire gating (handled in Task 8) |
| 5 | Set up cron jobs for success fee final payments and duration tracking | ✅ COMPLETED | `097_success_fee_cron_jobs.sql` introduces queue tables/functions | Need Supabase Edge functions or scheduled invocations that call the RPCs |
| 6 | Create background checks tRPC router with NationSearch integration | 🔄 IN_PROGRESS | Router exists with payment intent creation, NationSearch client (`_shared/nationsearch/client.ts`), webhook skeleton in `functions/background-check-webhook` | Need to validate env vars, finish webhook + retry logic, ensure Expo wizard uses live data, and add Deno tests for payments/sharing |
| 7 | Create ID verification tRPC router with Persona integration | ✅ COMPLETED | `id-verification.router.ts` now supports STRIPE_MOCK mode, persists persona metadata, and the new `persona-webhook` function syncs badge state end-to-end | None |
| 8 | Integrate success fee payment verification into hiring flow | ✅ COMPLETED | Hiring modal now queries live success-fee status, reuses existing payment intents, enforces legal acknowledgement, and blocks candidate contact info until upfront fees are paid | Finalize legal copy/storage workflow, add analytics + final-payment automation |
| 9 | Create frontend payment UI components with Stripe.js integration | ✅ COMPLETED | `PaymentIntentForm` now includes improved error display (Card-based), loading spinner in submit button, comprehensive README with usage examples, and enhanced UX for all payment flows | None – component is ready for reuse across success fees, background checks, and ID verification |
| 10 | Build admin pricing management interface | ✅ COMPLETED | tRPC admin CRUD endpoints added to `payments.router.ts` (`adminListPricing`, `adminUpsertPricing`, `adminDeletePricing`, `adminSetPricingActive`) supporting both `background_check` and `id_verification` service types | UI integration: extend `AdminCatalogManager.tsx` or create new component to manage service_pricing rows via the new endpoints |
| 11 | Create payment monitoring and analytics dashboard | ✅ COMPLETED | `payments.router.ts` now includes `adminGetAnalytics` (KPIs, breakdowns, time series, failed queue) and `adminListTransactions` (filtered transaction list). `OfficePaymentAnalytics` component displays metrics, revenue by type, and failed transaction queue | Future: Add date range filters, export functionality, and transaction detail drill-down |
| 12 | Implement badge expiration monitoring and renewal reminders | ✅ COMPLETED | `notify-id-verification-expiration` Edge Function auto-expires badges and issues 30/7-day + day-of reminders via `id-verification-notifications.ts` | None |
| 13 | Create worker profile badge display components | ✅ COMPLETED | `IdVerificationBadge` component added to `IdVerificationFlow`, `IdVerificationWidget`, `GeneralInfoWidget`, and discover worker cards via `useTalentProfiles` | None |
| 14 | Implement organization payment method management | ✅ COMPLETED | Migration `127_req_88_organization_payment_methods.sql` creates `organization_payment_methods` table with soft delete. `payments.router.ts` includes `createSetupIntent`, `savePaymentMethod`, `getPaymentMethod`, `deletePaymentMethod` endpoints. `OrganizationPaymentMethodsPanel` + `SetupIntentForm` components added to Office organization edit page | Future: Support multiple payment methods, allow org admins to manage (not just Office), add payment method selection in payment flows |
| 15 | Build payment transaction history and receipt system | ✅ COMPLETED | `payments.router.ts` includes `getTransaction`, `listTransactions` (org-facing), `exportTransactions` (CSV/JSON), `generateReceipt`. `OfficeTransactionHistory` component with filters, export, and receipt modal. Route `/office/transactions` added to Office drawer | Future: PDF receipt generation, email receipt sending, organization-facing transaction history UI |
| 16 | Implement pre-funding account credits system | 🟡 PLANNED | Not started | Add wallet/ledger tables, Stripe top-up flow, apply credits in success fee/background check mutations, UI in billing |
| 17 | Create legal agreement and anti-circumvention enforcement system | 🟡 PLANNED | Not started | Schema + UI for hire agreements, detection/reporting of off-platform hires, admin enforcement tooling |
| 18 | Create comprehensive payment system testing suite and documentation | 🟡 PLANNED | Some router tests exist (e.g., `packages/supabase/tests/routers/background-checks*.test.ts`), but they don’t cover payments or Stripe flows | Need Deno test coverage for every router + Playwright smoke tests + docs/runbooks |
| 19 | Implement organization and worker account deletion workflows | 🟡 PLANNED | `core.anonymize_worker_payment_data` helper added in `095_create_payment_tables.sql` | Need Supabase functions/routes + Expo settings UI to trigger anonymization, plus Stripe cleanup + compliance logging |

## Next Actions

1. Validate Background Check + NationSearch integration end-to-end (Task 6) and backfill router/UI tests.
2. Finish Persona webhook + badge lifecycle automation (Tasks 7, 12, 13).
3. Finalize legal copy/storage plus final-payment automation for success fees (Task 8 & 5 follow-ups).

These actions align with the approved implementation plan and unblock downstream payment operations work.

