# Payment System Overview

**Last Updated:** November 18, 2025  
**Status:** Production Ready  
**Related REQ:** REQ-88

## Overview

The SCF-Neue payment system provides comprehensive payment processing, transaction management, and billing features using Stripe as the payment processor. The system supports success fees, background checks, ID verification, account credits, and legal agreement tracking.

## Architecture

### Database Schema

**Core Tables:**
- `payment_transactions` - All payment transactions (success fees, background checks, ID verification, credits)
- `success_fees` - Success fee records with payment schedules
- `background_checks` - Background check records with payment tracking
- `id_verifications` - ID verification records with badge status
- `service_pricing` - Configurable pricing for services
- `account_credits` - Pre-funded account balances for organizations
- `credit_ledger` - Audit trail for credit transactions
- `organization_payment_methods` - Saved payment methods for organizations
- `hire_agreements` - Legal agreements for on-platform hires
- `circumvention_reports` - Anti-circumvention violation reports

**Key Migrations:**
- `095_create_payment_tables.sql` - Core payment tables
- `096_payment_rls_policies.sql` - Row Level Security policies
- `127_req_88_organization_payment_methods.sql` - Payment method storage
- `128_req_88_account_credits.sql` - Account credits system
- `129_req_88_legal_agreements.sql` - Legal agreements and violations

### tRPC Routers

**payments.router.ts:**
- Payment method management (`createSetupIntent`, `savePaymentMethod`, `getPaymentMethod`, `deletePaymentMethod`)
- Account credits (`getAccountCredits`, `depositCredits`, `getCreditLedger`, `applyCreditsToPayment`, `checkAndApplyCredits`)
- Transaction history (`getTransaction`, `listTransactions`, `exportTransactions`, `generateReceipt`)
- Admin analytics (`adminGetAnalytics`, `adminListTransactions`, `adminListPricing`, `adminUpsertPricing`, `adminDeletePricing`, `adminSetPricingActive`)

**success-fees.router.ts:**
- Fee calculation and payment scheduling
- Payment intent creation and confirmation
- Auto-creates hire agreements on payment confirmation

**legal-agreements.router.ts:**
- Hire agreement creation and management
- Violation reporting and admin review workflow

**background-checks.router.ts:**
- Background check payment processing
- NationSearch integration

**id-verification.router.ts:**
- ID verification payment processing
- Persona integration

## Payment Flows

### Success Fee Payment

1. Organization creates success fee via `createSuccessFee`
2. System calculates upfront and final payment amounts
3. PaymentIntent created for upfront payment
4. User confirms payment via `confirmUpfrontPayment`
5. Hire agreement automatically created
6. Final payment processed via `processFinalPayment` (cron job)

### Background Check Payment

1. User requests background check via `requestCheck`
2. System calculates price based on tier and add-ons
3. PaymentIntent created
4. User confirms payment via `confirmCheckPayment`
5. Check submitted to NationSearch

### ID Verification Payment

1. User requests verification via `requestVerification`
2. System retrieves pricing
3. PaymentIntent created
4. User confirms payment via `confirmVerificationPayment`
5. Inquiry created in Persona

### Account Credits

1. Organization deposits credits via `depositCredits`
2. PaymentIntent created for deposit amount
3. On payment success, credits added to `account_credits` balance
4. Credit transaction recorded in `credit_ledger`
5. Credits can be applied to payments via `applyCreditsToPayment`

## Security & Compliance

### Row Level Security (RLS)

- Organization members can view their organization's payment data
- Office users can view all payment data
- Workers can view their own payment transactions
- Payment methods are scoped to organization members

### Data Protection

- Payment method details stored securely in Stripe (not in our database)
- Only payment method metadata (last4, brand, expiry) stored locally
- All sensitive operations require authentication
- Audit trails for all transactions

### Legal Agreements

- Hire agreements automatically created on success fee payment
- Anti-circumvention clause acceptance tracked
- Violation reporting system for off-platform hires
- Admin review workflow for violations

## Testing

### Test Coverage

**Location:** `packages/supabase/tests/routers/`

**Test Files:**
- `payments.test.ts` - Payment router tests (account credits, analytics, transactions)
- `legal-agreements.test.ts` - Legal agreement and violation reporting tests

**Test Patterns:**
- Uses `STRIPE_MOCK_MODE=1` for Stripe testing
- Creates seeded test data via `createSeedClient`
- Uses `callTRPCEndpoint` helper for tRPC calls
- Requires auth setup via `requireAuthSetup`

**Running Tests:**
```bash
cd packages/supabase
deno test tests/routers/payments.test.ts
deno test tests/routers/legal-agreements.test.ts
```

## UI Components

### Office Dashboard

**Payment Analytics** (`/office/payments`):
- KPI cards (total revenue, success rate)
- Revenue breakdown by transaction type
- Failed transactions queue

**Transaction History** (`/office/transactions`):
- Filterable transaction list
- CSV export functionality
- Receipt modal for individual transactions

**Violation Reports** (`/office/violations`):
- Admin review of anti-circumvention violations
- Status management (pending → under_review → confirmed/dismissed)
- Resolution actions

### Organization Management

**Payment Methods** (Organization edit page):
- Add/replace payment method via SetupIntent
- View current payment method details
- Remove payment method (soft delete)

**Account Credits** (Organization edit page):
- View current balance
- Deposit credits via Stripe
- Recent transaction history

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `STRIPE_API_KEY_SECRET_ID` | Reference to Stripe API key in Vault |
| `STRIPE_WEBHOOK_SECRET_ID` | Reference to Stripe webhook secret in Vault |
| `STRIPE_MOCK_MODE` | When `1`, uses mock Stripe client (for testing) |

## Webhooks

**Stripe Webhook Handler:** `packages/supabase/functions/stripe-webhook/index.ts`

**Handled Events:**
- `payment_intent.succeeded` - Updates transaction status
- `payment_intent.payment_failed` - Records failure reason
- `setup_intent.succeeded` - Confirms payment method setup

## Cron Jobs

**Success Fee Final Payments:** `packages/supabase/migrations/097_success_fee_cron_jobs.sql`

- Automatically processes final payments when job duration ends
- Updates success fee status to `final_paid`
- Records transaction in `payment_transactions`

## Future Enhancements

- [ ] PDF receipt generation
- [ ] Email receipt sending
- [ ] Credit application in payment flows (auto-use credits if available)
- [ ] Multiple payment methods per organization
- [ ] Organization-facing transaction history UI
- [ ] User-facing violation reporting UI
- [ ] Automated violation detection heuristics
- [ ] Email notifications for violations

## Related Documentation

- [Background Check Operations Guide](../features/background-checks-operations.md)
- [REQ-88 Baseline Inventory](../status/req-88-baseline.md)

