-- 129_req_88_legal_agreements.sql
-- Adds legal agreement tracking and anti-circumvention enforcement

BEGIN;

-- ========================================================
-- Hire agreements (legal contracts for on-platform hires)
-- ========================================================
CREATE TABLE IF NOT EXISTS core.hire_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  worker_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES core.applications(id) ON DELETE SET NULL,
  success_fee_id UUID REFERENCES core.success_fees(id) ON DELETE SET NULL,
  
  -- Agreement details
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  agreement_text TEXT NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agreed_by_user_id UUID REFERENCES auth.users(id),
  
  -- Terms acknowledgment
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  anti_circumvention_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'violated', 'voided', 'disputed')),
  violated_at TIMESTAMPTZ,
  violation_reason TEXT,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.hire_agreements
  IS 'Legal agreements for on-platform hires. Tracks acceptance of terms and anti-circumvention clauses.';
COMMENT ON COLUMN core.hire_agreements.agreement_version
  IS 'Version of the agreement text to track changes over time.';
COMMENT ON COLUMN core.hire_agreements.anti_circumvention_accepted
  IS 'Confirms acceptance of anti-circumvention clause requiring on-platform communication and payment.';

CREATE UNIQUE INDEX IF NOT EXISTS hire_agreements_success_fee_idx
  ON core.hire_agreements (success_fee_id)
  WHERE success_fee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS hire_agreements_org_worker_idx
  ON core.hire_agreements (organization_id, worker_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hire_agreements_application_idx
  ON core.hire_agreements (application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS hire_agreements_status_idx
  ON core.hire_agreements (status);

CREATE TRIGGER hire_agreements_set_updated_at
  BEFORE UPDATE ON core.hire_agreements
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ========================================================
-- Anti-circumvention violation reports
-- ========================================================
CREATE TABLE IF NOT EXISTS core.circumvention_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report details
  reported_by_user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  worker_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  hire_agreement_id UUID REFERENCES core.hire_agreements(id) ON DELETE SET NULL,
  
  -- Violation details
  violation_type TEXT NOT NULL CHECK (
    violation_type IN (
      'off_platform_hire',      -- Hired worker off-platform without paying fee
      'off_platform_communication', -- Communication moved off-platform
      'fee_avoidance',           -- Attempted to avoid success fee
      'other'                    -- Other violation
    )
  ),
  description TEXT NOT NULL,
  evidence_urls TEXT[],
  evidence_notes TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'confirmed', 'dismissed', 'resolved')),
  reviewed_by_user_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Resolution
  resolution_action TEXT CHECK (
    resolution_action IN (
      'warning_issued',
      'fee_collected',
      'account_suspended',
      'account_terminated',
      'no_action',
      'other'
    )
  ),
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.circumvention_reports
  IS 'Reports of anti-circumvention violations. Tracks off-platform hires, fee avoidance, and other violations.';
COMMENT ON COLUMN core.circumvention_reports.evidence_urls
  IS 'Array of URLs to evidence (screenshots, emails, etc.) supporting the violation claim.';

CREATE INDEX IF NOT EXISTS circumvention_reports_status_idx
  ON core.circumvention_reports (status);

CREATE INDEX IF NOT EXISTS circumvention_reports_org_idx
  ON core.circumvention_reports (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS circumvention_reports_worker_idx
  ON core.circumvention_reports (worker_user_id, created_at DESC)
  WHERE worker_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS circumvention_reports_agreement_idx
  ON core.circumvention_reports (hire_agreement_id)
  WHERE hire_agreement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS circumvention_reports_type_idx
  ON core.circumvention_reports (violation_type);

CREATE TRIGGER circumvention_reports_set_updated_at
  BEFORE UPDATE ON core.circumvention_reports
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ========================================================
-- Helper function: Get default agreement text
-- ========================================================
CREATE OR REPLACE FUNCTION core.get_default_hire_agreement_text()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PLACEHOLDER: Legal Agreement Text

By proceeding with this hire through the platform, you agree to:

1. Platform Terms of Service
2. Anti-Circumvention Policy: All communication and hiring must remain on-platform. Off-platform hiring without payment of the success fee is prohibited.
3. Payment Terms: Success fees are due as specified in the payment schedule.

Violations may result in account suspension, fee collection, or legal action.';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================================
-- Row Level Security
-- ========================================================
ALTER TABLE core.hire_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hire_agreements_select ON core.hire_agreements;
CREATE POLICY hire_agreements_select ON core.hire_agreements
  FOR SELECT TO authenticated
  USING (
    core.is_org_member(organization_id)
    OR worker_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

DROP POLICY IF EXISTS hire_agreements_insert ON core.hire_agreements;
CREATE POLICY hire_agreements_insert ON core.hire_agreements
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND agreed_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS hire_agreements_update ON core.hire_agreements;
CREATE POLICY hire_agreements_update ON core.hire_agreements
  FOR UPDATE TO authenticated
  USING (
    core.is_org_member(organization_id)
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  )
  WITH CHECK (
    core.is_org_member(organization_id)
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

ALTER TABLE core.circumvention_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS circumvention_reports_select ON core.circumvention_reports;
CREATE POLICY circumvention_reports_select ON core.circumvention_reports
  FOR SELECT TO authenticated
  USING (
    reported_by_user_id = auth.uid()
    OR organization_id IN (SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid())
    OR worker_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

DROP POLICY IF EXISTS circumvention_reports_insert ON core.circumvention_reports;
CREATE POLICY circumvention_reports_insert ON core.circumvention_reports
  FOR INSERT TO authenticated
  WITH CHECK (reported_by_user_id = auth.uid());

DROP POLICY IF EXISTS circumvention_reports_update ON core.circumvention_reports;
CREATE POLICY circumvention_reports_update ON core.circumvention_reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

GRANT ALL ON TABLE core.hire_agreements TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE core.hire_agreements TO authenticated;

GRANT ALL ON TABLE core.circumvention_reports TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE core.circumvention_reports TO authenticated;

COMMIT;

