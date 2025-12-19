-- 128_req_88_account_credits.sql
-- Adds account credits/wallet system for pre-funding payments

BEGIN;

-- ========================================================
-- Organization account credits (wallet balance)
-- ========================================================
CREATE TABLE IF NOT EXISTS core.account_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id)
);

COMMENT ON TABLE core.account_credits
  IS 'Tracks pre-funded account balance for organizations. Credits can be used to pay for services instead of charging payment methods directly.';
COMMENT ON COLUMN core.account_credits.balance_cents
  IS 'Current available balance in cents. Must be non-negative.';

CREATE INDEX IF NOT EXISTS account_credits_org_idx
  ON core.account_credits (organization_id);

DROP TRIGGER IF EXISTS account_credits_set_updated_at ON core.account_credits;
CREATE TRIGGER account_credits_set_updated_at
  BEFORE UPDATE ON core.account_credits
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ========================================================
-- Credit ledger (transaction history for credits)
-- ========================================================
CREATE TABLE IF NOT EXISTS core.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_credit_id UUID NOT NULL REFERENCES core.account_credits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'deposit',      -- Top-up via Stripe
      'withdrawal',   -- Used for payment
      'refund',       -- Refunded to credits
      'expiration',  -- Credits expired (if we add TTL)
      'adjustment'    -- Manual adjustment by admin
    )
  ),
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  
  -- References
  payment_transaction_id UUID REFERENCES core.payment_transactions(id) ON DELETE SET NULL,
  success_fee_id UUID REFERENCES core.success_fees(id) ON DELETE SET NULL,
  background_check_id UUID REFERENCES core.background_checks(id) ON DELETE SET NULL,
  id_verification_id UUID REFERENCES core.id_verifications(id) ON DELETE SET NULL,
  
  -- Metadata
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.credit_ledger
  IS 'Audit trail for all credit transactions. Every deposit, withdrawal, refund, or adjustment is recorded here.';
COMMENT ON COLUMN core.credit_ledger.direction
  IS 'credit = increases balance, debit = decreases balance';

CREATE INDEX IF NOT EXISTS credit_ledger_account_idx
  ON core.credit_ledger (account_credit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_ledger_org_idx
  ON core.credit_ledger (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS credit_ledger_type_idx
  ON core.credit_ledger (transaction_type);

CREATE INDEX IF NOT EXISTS credit_ledger_payment_transaction_idx
  ON core.credit_ledger (payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;

-- ========================================================
-- Helper function: Get or create account credits
-- ========================================================
CREATE OR REPLACE FUNCTION core.get_or_create_account_credits(
  p_organization_id UUID
) RETURNS UUID AS $$
DECLARE
  v_credit_id UUID;
BEGIN
  SELECT id INTO v_credit_id
  FROM core.account_credits
  WHERE organization_id = p_organization_id;

  IF v_credit_id IS NULL THEN
    INSERT INTO core.account_credits (organization_id)
    VALUES (p_organization_id)
    RETURNING id INTO v_credit_id;
  END IF;

  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- Helper function: Apply credit transaction
-- ========================================================
CREATE OR REPLACE FUNCTION core.apply_credit_transaction(
  p_organization_id UUID,
  p_amount_cents INTEGER,
  p_transaction_type TEXT,
  p_direction TEXT,
  p_description TEXT DEFAULT NULL,
  p_payment_transaction_id UUID DEFAULT NULL,
  p_success_fee_id UUID DEFAULT NULL,
  p_background_check_id UUID DEFAULT NULL,
  p_id_verification_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_credit_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get or create account credits
  v_credit_id := core.get_or_create_account_credits(p_organization_id);

  -- Calculate new balance
  IF p_direction = 'credit' THEN
    v_new_balance := (SELECT balance_cents FROM core.account_credits WHERE id = v_credit_id) + p_amount_cents;
  ELSE
    v_new_balance := (SELECT balance_cents FROM core.account_credits WHERE id = v_credit_id) - p_amount_cents;
    
    -- Prevent negative balance
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient credits. Current balance: %, requested: %', 
        (SELECT balance_cents FROM core.account_credits WHERE id = v_credit_id),
        p_amount_cents;
    END IF;
  END IF;

  -- Update balance
  UPDATE core.account_credits
  SET balance_cents = v_new_balance
  WHERE id = v_credit_id;

  -- Record in ledger
  INSERT INTO core.credit_ledger (
    account_credit_id,
    organization_id,
    amount_cents,
    currency,
    transaction_type,
    direction,
    description,
    payment_transaction_id,
    success_fee_id,
    background_check_id,
    id_verification_id,
    metadata,
    created_by
  )
  VALUES (
    v_credit_id,
    p_organization_id,
    p_amount_cents,
    (SELECT currency FROM core.account_credits WHERE id = v_credit_id),
    p_transaction_type,
    p_direction,
    p_description,
    p_payment_transaction_id,
    p_success_fee_id,
    p_background_check_id,
    p_id_verification_id,
    p_metadata,
    p_created_by
  )
  RETURNING id INTO v_credit_id;

  RETURN v_credit_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- Row Level Security
-- ========================================================
ALTER TABLE core.account_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_credits_select ON core.account_credits;
CREATE POLICY account_credits_select ON core.account_credits
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS account_credits_update ON core.account_credits;
CREATE POLICY account_credits_update ON core.account_credits
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

ALTER TABLE core.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_ledger_select ON core.credit_ledger;
CREATE POLICY credit_ledger_select ON core.credit_ledger
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

GRANT ALL ON TABLE core.account_credits TO service_role;
GRANT SELECT, UPDATE ON TABLE core.account_credits TO authenticated;

GRANT ALL ON TABLE core.credit_ledger TO service_role;
GRANT SELECT, INSERT ON TABLE core.credit_ledger TO authenticated;

COMMIT;

