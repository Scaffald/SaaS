-- Allow applicants to read activity entries for their own applications
DROP POLICY IF EXISTS "Applicants can view activity for their own applications" ON core.application_activity;
CREATE POLICY "Applicants can view activity for their own applications"
  ON core.application_activity FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM core.applications WHERE user_id = auth.uid()
    )
  );
