-- =========================================================
-- 113_req_221_inquiry_policies.sql
-- Row level security policies and grants for inquiry system
-- =========================================================

BEGIN;

-- =========================================================
-- Update existing application_inquiries policies
-- Allow organization members (not just owners) to create inquiries
-- =========================================================

-- Drop and recreate the write policy to include created_by check
DROP POLICY IF EXISTS app_inquiries_write ON core.application_inquiries;
CREATE POLICY app_inquiries_write ON core.application_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        -- Allow applicant to create (for responses)
        a.user_id = auth.uid()
        OR (
          -- Allow organization owner
          EXISTS (
            SELECT 1 FROM core.jobs j
            JOIN core.organizations o ON o.id = j.organization_id
            WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
          )
          OR
          -- Allow the user specified in created_by if they're an org member
          (
            created_by = auth.uid()
            AND EXISTS (
              SELECT 1 FROM core.jobs j
              JOIN core.organizations o ON o.id = j.organization_id
              WHERE j.id = a.job_id
              AND EXISTS (
                SELECT 1 FROM core.role_assignments ra
                WHERE ra.user_id = auth.uid()
                AND ra.scope_org_id = o.id
              )
            )
          )
        )
      )
    )
  );

-- Update policy to allow editing by creator or organization members
DROP POLICY IF EXISTS app_inquiries_update ON core.application_inquiries;
CREATE POLICY app_inquiries_update ON core.application_inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

-- =========================================================
-- Inquiry sections policies
-- =========================================================

ALTER TABLE core.inquiry_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_sections_read ON core.inquiry_sections;
CREATE POLICY inquiry_sections_read ON core.inquiry_sections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS inquiry_sections_insert ON core.inquiry_sections;
CREATE POLICY inquiry_sections_insert ON core.inquiry_sections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR iq.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS inquiry_sections_update ON core.inquiry_sections;
CREATE POLICY inquiry_sections_update ON core.inquiry_sections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Only applicant can accept sections
        a.user_id = auth.uid()
        OR accepted_by = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Only applicant can accept sections
        a.user_id = auth.uid()
        OR accepted_by = auth.uid()
      )
    )
  );

-- =========================================================
-- Inquiry comments policies
-- =========================================================

ALTER TABLE core.inquiry_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_comments_read ON core.inquiry_comments;
CREATE POLICY inquiry_comments_read ON core.inquiry_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR sender_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS inquiry_comments_insert ON core.inquiry_comments;
DROP POLICY IF EXISTS inquiry_comments_insert ON core.inquiry_comments;
CREATE POLICY inquiry_comments_insert ON core.inquiry_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS inquiry_comments_update ON core.inquiry_comments;
DROP POLICY IF EXISTS inquiry_comments_update ON core.inquiry_comments;
CREATE POLICY inquiry_comments_update ON core.inquiry_comments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Users can update read_by array (mark as read)
        a.user_id = auth.uid()
        OR sender_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR sender_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

-- =========================================================
-- Inquiry capability responses policies
-- =========================================================

ALTER TABLE core.inquiry_capability_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_capability_responses_read ON core.inquiry_capability_responses;
CREATE POLICY inquiry_capability_responses_read ON core.inquiry_capability_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS inquiry_capability_responses_insert ON core.inquiry_capability_responses;
DROP POLICY IF EXISTS inquiry_capability_responses_insert ON core.inquiry_capability_responses;
CREATE POLICY inquiry_capability_responses_insert ON core.inquiry_capability_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Only applicant can provide responses
        a.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS inquiry_capability_responses_update ON core.inquiry_capability_responses;
DROP POLICY IF EXISTS inquiry_capability_responses_update ON core.inquiry_capability_responses;
CREATE POLICY inquiry_capability_responses_update ON core.inquiry_capability_responses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Only applicant can update responses
        a.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.application_inquiries iq
      JOIN core.applications a ON a.id = iq.application_id
      WHERE iq.id = inquiry_id
      AND (
        -- Only applicant can update responses
        a.user_id = auth.uid()
      )
    )
  );

-- =========================================================
-- Grants
-- =========================================================

-- Inquiry sections
GRANT SELECT, INSERT, UPDATE ON core.inquiry_sections TO authenticated;
GRANT ALL ON core.inquiry_sections TO service_role;

-- Inquiry comments
GRANT SELECT, INSERT, UPDATE ON core.inquiry_comments TO authenticated;
GRANT ALL ON core.inquiry_comments TO service_role;

-- Inquiry capability responses
GRANT SELECT, INSERT, UPDATE ON core.inquiry_capability_responses TO authenticated;
GRANT ALL ON core.inquiry_capability_responses TO service_role;

COMMIT;

