# Payment System Runbook

**Last Updated:** November 18, 2025  
**Purpose:** Operational procedures for payment system maintenance and troubleshooting

## Common Operations

### View Payment Analytics

**Office Dashboard:**
1. Navigate to `/office/payments`
2. View KPIs: total revenue, success rate, transaction counts
3. Review revenue breakdown by transaction type
4. Check failed transactions queue

**API:**
```typescript
const analytics = await api.payments.adminGetAnalytics.useQuery();
```

### Export Transaction History

**Office Dashboard:**
1. Navigate to `/office/transactions`
2. Apply filters (status, type, date range) if needed
3. Click "Export CSV" button
4. File downloads with all transaction data

**API:**
```typescript
const exportData = await api.payments.exportTransactions.useQuery({
  format: "csv",
  startDate: "2025-01-01T00:00:00Z",
  endDate: "2025-12-31T23:59:59Z",
});
```

### Review Violation Reports

**Office Dashboard:**
1. Navigate to `/office/violations`
2. Review pending reports
3. Click "Review" to move to `under_review` status
4. Update status and add resolution action as needed

**API:**
```typescript
// List reports
const reports = await api.legalAgreements.listViolationReports.useQuery({
  status: "pending",
});

// Update report
await api.legalAgreements.updateViolationReport.useMutation({
  reportId: "report-id",
  status: "confirmed",
  resolutionAction: "fee_collected",
});
```

### Manage Organization Payment Methods

**Office Dashboard:**
1. Navigate to organization edit page
2. Scroll to "Payment Method" section
3. Click "Add Payment Method" or "Replace Payment Method"
4. Complete Stripe SetupIntent form
5. Payment method saved automatically

**API:**
```typescript
// Create SetupIntent
const setup = await api.payments.createSetupIntent.useMutation({
  organizationId: "org-id",
});

// Save payment method (after SetupIntent confirmation)
await api.payments.savePaymentMethod.useMutation({
  organizationId: "org-id",
  paymentMethodId: "pm_xxx",
});
```

### Deposit Account Credits

**Office Dashboard:**
1. Navigate to organization edit page
2. Scroll to "Account Credits" section
3. Enter deposit amount
4. Click "Continue to Payment"
5. Complete Stripe payment
6. Credits added automatically on payment success

**API:**
```typescript
await api.payments.depositCredits.useMutation({
  organizationId: "org-id",
  amountCents: 10000, // $100.00
});
```

## Troubleshooting

### Payment Intent Not Succeeding

**Symptoms:**
- PaymentIntent status remains `requires_payment_method` or `requires_confirmation`
- Transaction stuck in `pending` status

**Diagnosis:**
1. Check Stripe Dashboard for payment intent status
2. Review `payment_transactions` table for failure reason
3. Check webhook logs for Stripe events

**Resolution:**
- If payment method invalid, user needs to add new payment method
- If payment declined, check Stripe Dashboard for decline reason
- Manually update transaction status if webhook missed

### Insufficient Credits Error

**Symptoms:**
- `applyCreditsToPayment` returns "Insufficient credits" error

**Diagnosis:**
1. Check `account_credits` table for current balance
2. Review `credit_ledger` for recent transactions
3. Verify amount being withdrawn

**Resolution:**
- Organization needs to deposit more credits
- Or use payment method instead of credits
- Check for pending credit deposits that haven't cleared

### Missing Hire Agreement

**Symptoms:**
- Success fee payment succeeded but no hire agreement created

**Diagnosis:**
1. Check `hire_agreements` table for agreement linked to success fee
2. Review server logs for agreement creation errors
3. Verify `confirmUpfrontPayment` was called

**Resolution:**
- Manually create agreement via `legalAgreements.createHireAgreement`
- Check that success fee has `application_id` and `worker_user_id`
- Verify organization access permissions

### Violation Report Not Updating Agreement

**Symptoms:**
- Violation report created but hire agreement status not updated

**Diagnosis:**
1. Check `circumvention_reports` table for report
2. Verify `hire_agreement_id` is set correctly
3. Check `hire_agreements` table for status

**Resolution:**
- Manually update agreement status if needed
- Verify report has correct `hireAgreementId` when created
- Check RLS policies allow updates

## Monitoring

### Key Metrics to Watch

1. **Payment Success Rate** - Should be > 95%
   - Location: `/office/payments` analytics dashboard
   - Alert if drops below 90%

2. **Failed Transactions Queue** - Should be minimal
   - Location: `/office/payments` failed queue section
   - Review daily for patterns

3. **Pending Violation Reports** - Should be reviewed promptly
   - Location: `/office/violations`
   - Filter by `status: pending`

4. **Credit Balance Trends** - Monitor for unusual activity
   - Location: Organization edit page → Account Credits
   - Check for unexpected withdrawals or deposits

### Log Locations

- **Stripe Webhook Logs:** Supabase Edge Function logs
- **Payment Router Logs:** tRPC router console output
- **Transaction Records:** `payment_transactions` table
- **Credit Transactions:** `credit_ledger` table

## Emergency Procedures

### Refund a Transaction

1. Process refund in Stripe Dashboard
2. Update `payment_transactions` status to `refunded`
3. If credits were used, refund credits via `apply_credit_transaction` (direction: credit, type: refund)
4. Update related records (success fee, background check, etc.)

### Suspend Organization for Violations

1. Review violation reports in `/office/violations`
2. Update report status to `confirmed`
3. Set resolution action to `account_suspended`
4. Manually suspend organization account (outside payment system)
5. Document in report `review_notes`

### Manual Credit Adjustment

```sql
-- Add credits
SELECT core.apply_credit_transaction(
  p_organization_id := 'org-uuid',
  p_amount_cents := 5000,
  p_transaction_type := 'adjustment',
  p_direction := 'credit',
  p_description := 'Manual adjustment - support credit',
  p_created_by := 'user-uuid'
);

-- Remove credits
SELECT core.apply_credit_transaction(
  p_organization_id := 'org-uuid',
  p_amount_cents := 2000,
  p_transaction_type := 'adjustment',
  p_direction := 'debit',
  p_description := 'Manual adjustment - correction',
  p_created_by := 'user-uuid'
);
```

## Testing

### Run Payment System Tests

```bash
# All payment tests
cd packages/supabase
deno test tests/routers/payments.test.ts

# Legal agreements tests
deno test tests/routers/legal-agreements.test.ts

# With verbose output
STRIPE_MOCK_MODE=1 deno test --allow-all tests/routers/payments.test.ts
```

### Test Payment Flow Locally

1. Set `STRIPE_MOCK_MODE=1` in environment
2. Use test card numbers (4242 4242 4242 4242)
3. Monitor `payment_transactions` table for records
4. Check Stripe Dashboard (test mode) for payment intents

## Support Contacts

- **Stripe Support:** https://support.stripe.com
- **Payment System Issues:** Check `payment_transactions` and webhook logs
- **Credit Issues:** Review `credit_ledger` for transaction history
- **Violation Reports:** Review in `/office/violations` dashboard

